// Product media is processed in the owner's browser, before an upload.
export async function optimizePhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .86));
  if (!blob) throw new Error('Could not process this photo.');
  return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {type: 'image/webp'});
}

export async function prepareVideo(file, onProgress = () => {}) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  let source, stream, recorder, frame, timer;
  try {
    await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Could not read this video. Try MP4 or WebM.')), 10000);
      video.onloadeddata = () => { clearTimeout(timer); resolve(); };
      video.onerror = () => { clearTimeout(timer); reject(new Error('This video cannot play in this browser.')); };
      video.src = url;
    });
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 60)
      throw new Error('Use a video no longer than 60 seconds.');

    // Keep MP4 compatibility; if this browser cannot encode MP4, retain the source.
    // MediaRecorder records a supplied stream and never opens a camera or microphone.
    const mime = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : '';
    if (!mime || !video.captureStream || !HTMLCanvasElement.prototype.captureStream)
      return {file, note: 'Original video retained; this browser cannot optimize MP4.'};
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      await video.play();
      source = video.captureStream();
      stream = canvas.captureStream(24);
      source.getAudioTracks().forEach(track => stream.addTrack(track));
      const chunks = [];
      recorder = new MediaRecorder(stream, {mimeType: mime, videoBitsPerSecond: 1800000, audioBitsPerSecond: 96000});
      const result = new Promise((resolve, reject) => {
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = () => resolve(new Blob(chunks, {type: 'video/mp4'}));
        recorder.onerror = () => reject(new Error('Video optimization failed.'));
        video.onended = () => { if (recorder.state !== 'inactive') recorder.stop(); };
        timer = setTimeout(() => reject(new Error('Video optimization timed out.')), (video.duration + 12) * 1000);
      });
      const draw = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        onProgress(Math.min(100, Math.round(video.currentTime / video.duration * 100)));
        frame = requestAnimationFrame(draw);
      };
      recorder.start(500);
      draw();
      const blob = await result;
      if (!blob.size || blob.size >= file.size) return {file, note: 'Original retained: already smaller than the optimized video.'};
      return {
        file: new File([blob], file.name.replace(/\.[^.]+$/, '.mp4'), {type: 'video/mp4'}),
        note: `Video optimized: ${Math.round((1 - blob.size / file.size) * 100)}% smaller.`
      };
    } catch {
      return {file, note: 'Original video retained; browser optimization was unavailable.'};
    }
  } finally {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    video.pause();
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    source?.getTracks().forEach(track => track.stop());
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
