import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

// Rebuild derivatives from the uncompressed originals every time. Never run
// quantization repeatedly on a previously optimized file.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const models = ['iphone-16-pro-max', 'iphone-18-pro-max', 'iphone-duo'];
const sourceDir = path.join(root, 'public', 'models');
const outputDir = path.join(sourceDir, 'optimized');
const reportPath = path.join(root, 'docs', 'model-optimization.json');
const checkOnly = process.argv.includes('--check');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const asBytes = array => new Uint8Array(array.buffer, array.byteOffset, array.byteLength);

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
});

function matrixProduct(a, b) {
  const result = new Array(16).fill(0);
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) {
    for (let k = 0; k < 4; k++) result[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
  }
  return result;
}

function transformPoint(point, matrix) {
  return [0, 1, 2].map(row => matrix[row] * point[0] + matrix[4 + row] * point[1] + matrix[8 + row] * point[2] + matrix[12 + row]);
}

// glTF Transform's generic getBounds explicitly ignores skinning. The Duo's
// normalized positions are compensated by inverse bind matrices, so validation
// must apply those matrices rather than mistake [-1,1] positions for its size.
function worldBounds(document) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const skin = node.getSkin();
    const world = node.getWorldMatrix();
    const jointMatrices = skin?.listJoints().map((joint, index) => matrixProduct(joint.getWorldMatrix(), skin.getInverseBindMatrices()?.getElement(index, []) || identity));
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      const joint = primitive.getAttribute('JOINTS_0');
      const weight = primitive.getAttribute('WEIGHTS_0');
      const indices = primitive.getIndices();
      const count = indices?.getCount() ?? position.getCount();
      for (let vertex = 0; vertex < count; vertex++) {
        const index = indices ? indices.getScalar(vertex) : vertex;
        const point = position.getElement(index, []);
        let transformed;
        if (jointMatrices && joint && weight) {
          const joints = joint.getElement(index, []);
          const weights = weight.getElement(index, []);
          transformed = [0, 0, 0];
          for (let k = 0; k < joints.length; k++) {
            if (!weights[k]) continue;
            const weighted = transformPoint(point, jointMatrices[joints[k]]);
            for (let axis = 0; axis < 3; axis++) transformed[axis] += weighted[axis] * weights[k];
          }
        } else transformed = transformPoint(point, world);
        for (let axis = 0; axis < 3; axis++) { min[axis] = Math.min(min[axis], transformed[axis]); max[axis] = Math.max(max[axis], transformed[axis]); }
      }
    }
  }
  return { min, max };
}

function poseBounds(document, time) {
  const savedTransforms = document.getRoot().listNodes().map(node => ({ node, translation: node.getTranslation(), rotation: node.getRotation(), scale: node.getScale() }));
  for (const animation of document.getRoot().listAnimations()) for (const channel of animation.listChannels()) {
    const sampler = channel.getSampler();
    const input = sampler.getInput();
    const output = sampler.getOutput();
    let frame = 0;
    while (frame < input.getCount() - 1 && input.getScalar(frame + 1) <= time) frame++;
    const next = Math.min(frame + 1, input.getCount() - 1);
    const a = output.getElement(frame, []);
    let b = output.getElement(next, []);
    const span = input.getScalar(next) - input.getScalar(frame);
    const fraction = sampler.getInterpolation() === 'STEP' || !span ? 0 : Math.max(0, Math.min(1, (time - input.getScalar(frame)) / span));
    let value;
    if (channel.getTargetPath() === 'rotation') {
      let dot = a.reduce((sum, component, i) => sum + component * b[i], 0);
      if (dot < 0) { b = b.map(component => -component); dot = -dot; }
      const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sine = Math.sin(theta);
      value = sine > 0.00001 ? a.map((component, i) => (component * Math.sin((1 - fraction) * theta) + b[i] * Math.sin(fraction * theta)) / sine) : a.map((component, i) => component + (b[i] - component) * fraction);
      const magnitude = Math.hypot(...value);
      value = value.map(component => component / magnitude);
    } else value = a.map((component, i) => component + (b[i] - component) * fraction);
    const node = channel.getTargetNode();
    if (channel.getTargetPath() === 'translation') node.setTranslation(value);
    else if (channel.getTargetPath() === 'rotation') node.setRotation(value);
    else if (channel.getTargetPath() === 'scale') node.setScale(value);
    else throw new Error('Pose validation currently supports translation, rotation and scale animation only.');
  }
  const bounds = worldBounds(document);
  for (const saved of savedTransforms) saved.node.setTranslation(saved.translation).setRotation(saved.rotation).setScale(saved.scale);
  return bounds;
}

function snapshot(document) {
  const model = document.getRoot();
  const textureImages = model.listTextures().map(texture => ({
    mimeType: texture.getMimeType(), bytes: texture.getImage()?.byteLength || 0,
    sha256: hash(texture.getImage() || new Uint8Array()),
  })).sort((a, b) => a.sha256.localeCompare(b.sha256));
  let triangles = 0;
  let primitiveCount = 0;
  for (const mesh of model.listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      primitiveCount++;
      if (primitive.getMode() === 4) triangles += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
    }
  }
  const animations = model.listAnimations().map(animation => {
    let start = Infinity;
    let end = -Infinity;
    const channels = animation.listChannels().map(channel => {
      const sampler = channel.getSampler();
      const times = sampler.getInput().getArray();
      for (const time of times) { start = Math.min(start, time); end = Math.max(end, time); }
      return {
        node: channel.getTargetNode()?.getName() || '', path: channel.getTargetPath(),
        interpolation: sampler.getInterpolation(), keyframes: sampler.getInput().getCount(),
        inputSha256: hash(asBytes(times)), outputSha256: hash(asBytes(sampler.getOutput().getArray())),
      };
    }).sort((a, b) => `${a.node}:${a.path}`.localeCompare(`${b.node}:${b.path}`));
    return { name: animation.getName(), start, end, duration: end - start, channels };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const bounds = worldBounds(document);
  const poses = animations.length ? [0, 1, 2].map(time => ({ time, bounds: poseBounds(document, time) })) : [];
  return { textureImages, triangles, primitiveCount, animations, bounds, poses, assetExtras: model.getAsset().extras || {} };
}

function parseGLB(bytes) {
  const buffer = Buffer.from(bytes);
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF');
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  let json;
  let binary;
  for (let offset = 12; offset < buffer.length;) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'JSON') json = JSON.parse(chunk.toString('utf8'));
    if (type === 'BIN\0') binary = chunk;
    offset += 8 + length;
  }
  return { json, binary };
}

function assertDecodedCompressedViews(bytes, decoder, referenceDecoder) {
  const { json, binary } = parseGLB(bytes);
  let count = 0;
  for (const view of json.bufferViews || []) {
    const compression = view.extensions?.EXT_meshopt_compression;
    if (!compression) continue;
    assert.equal(compression.buffer, 0, 'All compressed data must be embedded in this GLB.');
    const source = binary.subarray(compression.byteOffset || 0, (compression.byteOffset || 0) + compression.byteLength);
    const decoded = new Uint8Array(compression.count * compression.byteStride);
    decoder.decodeGltfBuffer(decoded, compression.count, compression.byteStride, source, compression.mode, compression.filter);
    assert.equal(decoded.byteLength, view.byteLength);
    if (referenceDecoder) {
      const reference = new Uint8Array(decoded.byteLength);
      referenceDecoder.decodeGltfBuffer(reference, compression.count, compression.byteStride, source, compression.mode, compression.filter);
      assert.deepEqual(decoded, reference, 'The bundled viewer must decode identical bytes to the reference decoder.');
    }
    count++;
  }
  assert.ok(count > 0, 'The derivative must contain compressed buffer views.');
  return count;
}

async function bundledViewerDecoder() {
  const viewerBytes = await readFile(path.join(root, 'public', 'vendor', 'model-viewer.min.js'));
  const source = viewerBytes.toString('utf8');
  const start = source.indexOf('var uu=function(){');
  assert.ok(start >= 0, 'The bundled viewer decoder changed. Review its compression compatibility before rebuilding.');
  const bodyStart = source.indexOf('{', start);
  let depth = 1;
  let quote = '';
  let escaped = false;
  let end = bodyStart + 1;
  for (; end < source.length; end++) {
    const character = source[end];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === '{') depth++;
    if (character === '}' && !--depth) break;
  }
  // Only the bundled decoder's standalone WASM module is evaluated. No DOM,
  // browser state, app source or model-viewer rendering code runs in this VM.
  const expression = source.slice(start + 'var uu='.length, end + 1);
  const decoder = vm.runInNewContext(`(${expression})()`, { WebAssembly, Uint8Array, ArrayBuffer, Promise, self: {} });
  await decoder.ready;
  return { decoder, viewerSha256: hash(viewerBytes) };
}

if (!checkOnly) {
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  // meshoptimizer's .cjs build also contains a browser UMD branch. Copy that
  // branch-compatible source as .js for model-viewer's classic script loader.
  const packageDir = path.dirname(fileURLToPath(import.meta.resolve('meshoptimizer')));
  const decoder = await readFile(path.join(packageDir, 'meshopt_decoder.cjs'), 'utf8');
  const license = await readFile(path.join(packageDir, 'LICENSE.md'), 'utf8');
  await writeFile(path.join(root, 'public', 'vendor', 'meshopt_decoder.js'), `/*\n${license}\n*/\n${decoder}`, 'utf8');
}

const results = [];
const viewerCompatibility = await bundledViewerDecoder();
for (const name of models) {
  const sourcePath = path.join(sourceDir, `${name}.glb`);
  const outputPath = path.join(outputDir, `${name}-v2.glb`);
  const originalBytes = await readFile(sourcePath);
  const original = await io.read(sourcePath);
  const before = snapshot(original);

  if (!checkOnly) {
    await original.transform(meshopt({
      encoder: MeshoptEncoder,
      // 'high' uses lower-precision filters for normals. 'medium' permits
      // explicit 16-bit precision for all vertex attributes here.
      level: 'medium',
      quantizePosition: 16, quantizeNormal: 16, quantizeTexcoord: 16,
      quantizeColor: 16, quantizeWeight: 16, quantizeGeneric: 16,
    }));
    await io.write(outputPath, original);
  }

  const optimizedBytes = await readFile(outputPath);
  const decoded = await io.read(outputPath);
  const after = snapshot(decoded);
  assert.deepEqual(after.textureImages, before.textureImages, `${name}: texture bytes or formats changed.`);
  assert.deepEqual(after.animations, before.animations, `${name}: animation names, durations or keyframes changed.`);
  assert.deepEqual(after.assetExtras, before.assetExtras, `${name}: original credits/metadata changed.`);
  assert.equal(after.triangles, before.triangles, `${name}: triangles were removed.`);
  assert.equal(after.primitiveCount, before.primitiveCount, `${name}: primitive count changed.`);
  const extent = Math.max(...before.bounds.max.map((value, i) => Math.abs(value - before.bounds.min[i])));
  const absoluteBoundsError = Math.max(...before.bounds.min.map((value, i) => Math.abs(value - after.bounds.min[i])), ...before.bounds.max.map((value, i) => Math.abs(value - after.bounds.max[i])));
  const relativeBoundsError = absoluteBoundsError / (extent || 1);
  assert.ok(relativeBoundsError < 0.0002, `${name}: bounds changed beyond high-precision quantization tolerance.`);
  const poseBoundsErrors = before.poses.map((pose, index) => {
    const other = after.poses[index].bounds;
    const error = Math.max(...pose.bounds.min.map((value, i) => Math.abs(value - other.min[i])), ...pose.bounds.max.map((value, i) => Math.abs(value - other.max[i]))) / (extent || 1);
    assert.ok(error < 0.0002, `${name}: the animation pose at ${pose.time}s changed beyond the quantization tolerance.`);
    return { time: pose.time, relativeError: error, before: pose.bounds, after: other };
  });
  assert.equal(hash(await readFile(sourcePath)), hash(originalBytes), `${name}: original file was modified.`);
  const compressedViews = assertDecodedCompressedViews(optimizedBytes, MeshoptDecoder);
  assert.equal(assertDecodedCompressedViews(optimizedBytes, viewerCompatibility.decoder, MeshoptDecoder), compressedViews);
  const record = {
    source: `public/models/${name}.glb`, optimized: `public/models/optimized/${name}-v2.glb`,
    originalBytes: originalBytes.byteLength, optimizedBytes: optimizedBytes.byteLength,
    savedBytes: originalBytes.byteLength - optimizedBytes.byteLength,
    reductionPercent: Number((100 * (1 - optimizedBytes.byteLength / originalBytes.byteLength)).toFixed(2)),
    sourceSha256: hash(originalBytes), optimizedSha256: hash(optimizedBytes),
    triangles: after.triangles, primitiveCount: after.primitiveCount, compressedViews,
    textureBytesUnchanged: true, textureImages: after.textureImages,
    animationKeyframesUnchanged: true, animations: after.animations,
    bounds: { before: before.bounds, after: after.bounds, relativeError: relativeBoundsError },
    animationPoseBounds: poseBoundsErrors,
    requiredExtensions: parseGLB(optimizedBytes).json.extensionsRequired || [],
  };
  results.push(record);
  console.log(`${name}: ${record.originalBytes.toLocaleString()} → ${record.optimizedBytes.toLocaleString()} bytes (${record.reductionPercent}% smaller), ${after.triangles.toLocaleString()} triangles; animations: ${after.animations.map(animation => `${animation.name} ${animation.duration}s`).join(', ') || 'none'}`);
}

const decoderPath = path.join(root, 'public', 'vendor', 'meshopt_decoder.js');
const decoderBytes = await readFile(decoderPath);
const report = {
  generatedAt: new Date().toISOString(), generator: 'scripts/optimize_models.mjs',
  dependencies: { '@gltf-transform/core': '4.5.1', '@gltf-transform/extensions': '4.5.1', '@gltf-transform/functions': '4.5.1', meshoptimizer: '1.3.0' },
  settings: { meshoptLevel: 'medium', quantizationBits: 16, outOfRangeUVs: 'Original float precision retained', simplification: false, textureProcessing: false },
  note: 'Geometry quantization is high precision but not mathematically lossless. Original files, texture bytes, animation keyframes and credits are preserved. Browser rendering must still be visually checked.',
  decoder: { path: 'public/vendor/meshopt_decoder.js', bytes: decoderBytes.byteLength, sha256: hash(decoderBytes), license: 'MIT', externalWasmRequired: false },
  viewerCompatibility: { modelViewerSha256: viewerCompatibility.viewerSha256, bundledDecoderVerified: true, compressedViewsDecoded: results.reduce((sum, result) => sum + result.compressedViews, 0) },
  originalTotalBytes: results.reduce((sum, result) => sum + result.originalBytes, 0),
  optimizedTotalBytes: results.reduce((sum, result) => sum + result.optimizedBytes, 0),
  models: results,
};
if (!checkOnly) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${checkOnly ? 'Verified' : 'Generated'} ${results.length} derivatives. Textures, animations, original files and credits are preserved.`);
