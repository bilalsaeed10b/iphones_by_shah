'use strict';
const option = (label, description = '') => ({ value: label, label, description });
const normalize = items => items.map(item => typeof item === 'string' ? option(item) : option(item[0], item[1]));
const radio = (id, title, description, items, recommended) => ({ id, title, description, type: 'radio', options: normalize(items), recommended });
const checks = (id, title, description, items, recommended = []) => ({ id, title, description, type: 'checkbox', options: normalize(items), recommended });
const text = (id, title, description, recommended = '', multiline = false) => ({ id, title, description, type: multiline ? 'textarea' : 'text', recommended });
const range = (id, title, description, min, max, step, recommended, suffix) => ({ id, title, description, type: 'range', min, max, step, recommended, suffix });
const chapters = [
  { id: 'brand', title: 'Brand & business', subtitle: 'Get the identity and the commercial priorities right before we design the details.', callout: 'The name, logo and original business model come from you. Public-page findings are documented in the vision; accepting a suggestion here records your choice, not independent business-owner approval.', questions: [
    text('brand_name', 'What exact business name should the website use?', 'Match the spelling used on invoices and social channels.', 'iPhones by Shah'),
    text('brand_owner', 'Who is the business contact and final approver?', 'The Instagram profile displays Ukkasha Ali. Confirm who approves the site and policies.', 'Ukkasha Ali'),
    radio('positioning', 'How should the phones be positioned?', 'Use premium headline language. Product details must still disclose previous ownership and the actual condition.', [['Curated phones', 'A considered selection, presented with confidence.'], ['Premium pre-owned', 'Premium positioning with ownership stated upfront.'], ['Excellent-condition phones', 'Lead with the individual device’s condition.']], 'Curated phones'),
    radio('tagline', 'What happens to “The Name of Trust”?', 'This line is already part of your supplied logo.', [['Keep as a supporting line', 'Use it in the footer or brand story.'], ['Make it the main tagline', 'Give it a prominent place in the hero.'], ['Create a new line', 'Keep the logo intact; develop new supporting copy.']], 'Keep as a supporting line'),
    checks('audience', 'Who are the priority customers?', 'Choose all that apply. This shapes language, budgets and merchandising.', ['Students / first upgrades', 'Young professionals', 'iPhone enthusiasts', 'iPhone Pro Max buyers', 'Value-conscious buyers', 'Premium flagship buyers'], ['Young professionals', 'Value-conscious buyers', 'iPhone enthusiasts']),
    checks('categories', 'Which product categories launch on day one?', 'Apple iPhones are the focus of your corrected brief, including the iPhone 16 Pro Max. Other categories need confirmation.', ['Apple iPhones', 'Samsung / other Android', 'Accessories', 'iPads', 'Trade-in / buyback service'], ['Apple iPhones']),
    radio('primary_goal', 'What is the number-one business outcome?', 'Stock stays the primary customer feature in every version.', [['Stock enquiries', 'Help shoppers find an available device and contact Shah.'], ['Direct online orders', 'Make payment, shipping and order management part of launch.'], ['Store visits', 'Prioritize location, appointments and walk-ins.']], 'Stock enquiries'),
    text('brand_differences', 'What can Shah prove that other shops cannot?', 'List real differentiators: inspection process, sourcing, service or repeat customers. Avoid unsupported “certified” or “best” claims.', '', true),
    text('brand_inspiration', 'Any reference sites, must-haves or hard no’s?', 'Paste examples and say exactly what you like or dislike.', '', true)
  ]},
  { id: 'visual', title: 'Look & 3D motion', subtitle: 'A minimal white foundation, a bold phone composition, and just enough movement to make it memorable.', callout: 'The iPhone 18 Pro Max is the fixed center hero, as requested. The uploaded model is burgundy. Hero models are visual assets; their presence does not imply that a device is in stock.', questions: [
    radio('visual_direction', 'Which white-themed direction feels right?', 'Your choice updates the page palette and the small style preview.', [['White studio', 'Crisp off-white, large type and restrained detail.'], ['Warm editorial', 'Warm whites, human copy and a softer showroom feel.'], ['Pure monochrome', 'Bright white, black text and almost no accent color.']], 'White studio'),
    radio('accent', 'Choose the accent color.', 'The original logo uses warm orange. Burgundy complements the center phone.', [['Shah orange', 'A subtle connection to the existing brand.'], ['Burgundy', 'A richer match for the hero phone.'], ['Graphite', 'Keep the interface almost entirely monochrome.']], 'Shah orange'),
    radio('logo_use', 'How should the existing logo appear?', 'The supplied logo remains available in every direction.', [['Original + clean wordmark', 'Small original logo; readable text elsewhere.'], ['Original logo throughout', 'Use the complete supplied mark in key locations.'], ['Refine the existing identity', 'Create a separate logo refinement for approval.']], 'Original + clean wordmark'),
    radio('headline', 'Choose the hero copy direction.', 'These are concepts, not final business claims.', [['Your next phone. A whole new feeling.', 'An aspirational, minimal opening.'], ['Great phones. Chosen by Shah.', 'Put curation and the business name first.'], ['The Name of Trust. Your next upgrade.', 'Build around the existing tagline.']], 'Your next phone. A whole new feeling.'),
    radio('hero_motion', 'How should the three-phone hero move?', 'Keep controls usable and honor reduced-motion preferences.', [['Gentle float + cursor tilt', 'Subtle movement with no scroll locking.'], ['Scroll-driven choreography', 'Phones rearrange as the page scrolls; more production effort.'], ['Static pose + drag to rotate', 'Lowest motion, with optional interaction.']], 'Gentle float + cursor tilt'),
    radio('side_models', 'Which phones sit beside the center iPhone 18?', 'Your supplied iPhone 16 Pro Max is the supporting phone. The iPhone 18 Pro Max stays at the center.', [['Use the supplied 16 + Duo', 'Use all three available models.'], ['18 + iPhone 16 Pro Max', 'A focused two-phone composition.'], ['Keep the 18 alone', 'A simpler single-device hero composition.']], 'Use the supplied 16 + Duo'),
    radio('mobile_3d', 'What should happen on smaller phones?', 'The stock content must be available without waiting for heavy models.', [['Poster first, tap for 3D', 'Fast first paint; optional interaction.'], ['One optimized 3D hero', 'Load only the center model on mobile.'], ['Static posters only', 'The lightest mobile experience.']], 'Poster first, tap for 3D'),
    checks('micro_interactions', 'Which smaller interactions belong in the design?', 'Choose only the effects that help the experience.', ['Soft section reveals', 'Stock-card hover lift', 'Smooth gallery transitions', 'Filter transitions', 'Magnetic buttons', 'Custom cursor', 'Subtle loading skeletons', 'No decorative motion'], ['Soft section reveals', 'Stock-card hover lift', 'Smooth gallery transitions', 'Filter transitions', 'Subtle loading skeletons']),
    radio('stock_layout', 'How should stock cards feel?', 'Actual device photography should remain the focus.', [['Editorial grid', 'Large photos, compact details, calm spacing.'], ['Dense comparison grid', 'More specification detail visible at once.'], ['Large showcase cards', 'Fewer devices visible, bigger product storytelling.']], 'Editorial grid'),
    range('desktop_cards', 'How many stock columns on desktop?', 'Tablet and mobile adapt independently. The concept uses three columns.', 2, 4, 1, 3, ' columns')
  ]},
  { id: 'stock', title: 'Current stock', subtitle: 'The most important feature: an accurate, easy-to-browse catalogue of the devices available now.', callout: 'Recommended: one listing per physical phone. Two phones with the same model and storage can have different condition, battery health and photos.', questions: [
    radio('inventory_unit', 'What does one stock listing represent?', 'This affects stock accuracy and how condition information is attached.', [['One individual device', 'Each phone has its own stock ID, score and gallery.'], ['A model with device variants', 'Group variants but expose each unit’s real details.'], ['A batch of identical phones', 'Only if the phones genuinely share the same details.']], 'One individual device'),
    radio('home_stock', 'How should stock be advertised on the homepage?', 'The opening CTA should lead to Current stock.', [['Fresh stock immediately after hero', 'Show 6–8 available picks and a view-all link.'], ['Stock integrated into hero', 'Add a compact live stock strip beside the models.'], ['Featured deal first', 'One highlighted available device, then the catalogue.']], 'Fresh stock immediately after hero'),
    checks('stock_filters', 'Which filters should customers get?', 'These filters use actual listing fields and work together.', ['Brand', 'Model / series', 'Price range', 'Storage', 'Condition /10', 'Battery health', 'PTA status', 'Carrier / JV status', 'Color', 'SIM type', 'Available only'], ['Brand', 'Model / series', 'Price range', 'Storage', 'Condition /10', 'PTA status', 'Carrier / JV status', 'Available only']),
    radio('default_sort', 'What is the default stock order?', 'Extra sort options can include price and condition.', ['Newest arrivals', 'Featured first, then newest', 'Price: low to high'], 'Newest arrivals'),
    radio('search', 'How should search work?', 'Search by model, brand, storage and public stock ID.', [['Instant search', 'Update results as someone types.'], ['Search button', 'Submit the search explicitly.'], ['Filters only', 'Skip free-text search at launch.']], 'Instant search'),
    radio('prices', 'How should prices appear?', 'The public posts already lead with price. Do not expose purchase cost or profit margin.', [['Show PKR prices', 'Clear price on cards and details.'], ['Show price + negotiable note', 'Only if the business agrees to negotiation.'], ['Price on enquiry', 'More chat required for every buyer.']], 'Show PKR prices'),
    checks('stock_badges', 'Which badges are useful?', 'A badge needs a real admin-controlled meaning.', ['Fresh arrival', 'Featured pick', 'Available', 'Reserved', 'Sold', 'Price drop', 'Excellent condition', 'Verified inspection'], ['Fresh arrival', 'Featured pick', 'Available', 'Reserved', 'Sold']),
    radio('sold_behavior', 'What happens after a phone sells?', 'Never leave a sold device looking available.', [['Keep page, mark sold', 'Preserve links and suggest available alternatives.'], ['Move to a sold archive', 'Keep it outside the main available-stock results.'], ['Unpublish from catalogue', 'The public URL shows an unavailable notice.']], 'Keep page, mark sold'),
    radio('stock_freshness', 'How should customers see stock freshness?', 'A published update timestamp helps avoid relying on old social posts.', ['Last updated timestamp', 'Daily checked stamp', 'No visible timestamp'], 'Last updated timestamp'),
    radio('availability_refresh', 'How fast should stock changes reach visitors?', 'Available → reserved → sold should update across the homepage and catalogue.', [['Immediate with refresh', 'Admin changes publish quickly; polling or page refresh updates customers.'], ['Live push updates', 'Update active pages in real time.'], ['Scheduled daily publish', 'Simpler, but stock can be stale within the day.']], 'Immediate with refresh'),
    text('stock_volume', 'How many devices at launch, and how often does stock change?', 'Include rough counts, stock entry frequency and who will update it. No sales volume is assumed.', '', true)
  ]},
  { id: 'device', title: 'Device details', subtitle: 'Market the selection beautifully. Make the condition of each individual phone easy to understand.', callout: 'Keep PTA registration and carrier lock / JV status as separate fields. Condition /10 is a cosmetic grade, not battery health. Repairs, faults and prior ownership stay explicit on the product page.', questions: [
    checks('device_fields', 'Which details must every published listing have?', 'The essentials stay required even if you choose extra fields later.', ['Brand / model', 'Storage / color', 'Selling price in PKR', 'Stock ID', 'Condition /10', 'Battery health', 'PTA registration status', 'Carrier lock / JV status', 'SIM / eSIM type', 'Prior ownership', 'Repair / parts history', 'Known faults / cosmetic marks', 'Included box / cable', 'Checking / return terms'], ['Brand / model', 'Storage / color', 'Selling price in PKR', 'Stock ID', 'Condition /10', 'Battery health', 'PTA registration status', 'Carrier lock / JV status', 'SIM / eSIM type', 'Prior ownership', 'Repair / parts history', 'Known faults / cosmetic marks', 'Included box / cable', 'Checking / return terms']),
    radio('condition_method', 'How is the score out of 10 decided?', 'Create a written grading rubric. The score should have a plain-language explanation and close-up evidence.', [['Manual grade + checklist', 'Admin enters a score and inspection notes.'], ['Weighted inspection rubric', 'Use separate screen, frame and back scores.'], ['Score + condition tier', 'Show the score together with Excellent / Very good / Good.']], 'Manual grade + checklist'),
    radio('score_precision', 'What precision should the /10 rating use?', 'Be consistent across the stock catalogue.', ['Half points: 9, 9.5, 10', 'Whole points: 8, 9, 10', 'One decimal: 9.2, 9.4'], 'Half points: 9, 9.5, 10'),
    text('grading_rules', 'What exactly qualifies as a 10, 9, 8 or lower?', 'Define cosmetic grading and whether a fault makes a device unsuitable for listing.', '', true),
    radio('battery_display', 'How should battery information be shown?', 'Use the device-reported figure when available. For unsupported devices, show “not reported” or a test result with its method.', ['Battery % + test / source note', 'Battery % where available', 'Battery test summary'], 'Battery % + test / source note'),
    checks('inspection', 'Which inspection checks are actually performed?', 'Only display checks the shop has carried out on that device.', ['Display / touch', 'Face ID / fingerprint', 'Cameras', 'Speakers / microphone', 'Charging / port', 'Buttons', 'Wi-Fi / Bluetooth', 'SIM / calls', 'Battery', 'Parts / repair history', 'Activation lock check'], ['Display / touch', 'Face ID / fingerprint', 'Cameras', 'Speakers / microphone', 'Charging / port', 'Buttons', 'Wi-Fi / Bluetooth', 'SIM / calls', 'Battery', 'Parts / repair history', 'Activation lock check']),
    radio('gallery', 'What should the product media experience be?', 'Uploaded media belongs to the actual unit. Decorative 3D models cannot substitute for its photos.', [['Photos + short condition video', 'Close-ups and one short walkthrough.'], ['Photos only', 'A lighter first release.'], ['Photos + video + optional 3D', 'More production effort; the 3D is labeled illustrative.']], 'Photos + short condition video'),
    range('photo_count', 'How many actual-device photos should be required?', 'Recommended shots: front, back, both edges, camera area and any wear.', 3, 10, 1, 6, ' photos'),
    radio('identifier', 'How much device identification is public?', 'Keep complete serial / IMEI records in the protected admin.', ['Stock ID only', 'Stock ID + masked serial', 'Stock ID + last four IMEI digits'], 'Stock ID only'),
    radio('comparison', 'Should customers compare devices?', 'Compare price, storage, condition, battery and network status.', ['Compare up to 3 devices', 'Save favorites only', 'No comparison at launch'], 'Compare up to 3 devices')
  ]},
  { id: 'sales', title: 'Enquiries & orders', subtitle: 'Choose how an available phone becomes a real sale, and who handles the next step.', callout: 'The public stock posts send buyers to WhatsApp. Recommended launch: a stock enquiry with device ID and details already filled in, with staff confirming availability before a reservation.', questions: [
    radio('purchase_flow', 'How should customers buy at launch?', 'Payments and order fulfillment change the scope substantially.', [['WhatsApp enquiry first', 'Send model, stock ID and price into a prepared message.'], ['Website order request + COD', 'Collect an order request; staff confirms stock and delivery.'], ['Full online checkout', 'Add payments, order states, fulfillment and refund workflows.']], 'WhatsApp enquiry first'),
    text('whatsapp_primary', 'Which WhatsApp number is the primary sales line?', 'The official Linktree WhatsApp uses this number; Facebook also lists it.', '+92 341 8070670'),
    text('whatsapp_secondary', 'Which backup contact should be shown?', 'Both the location and recent stock reels list this second number.', '+92 323 3013439'),
    checks('enquiry_channels', 'Which other enquiry options should appear?', 'Choose the channels the team is ready to answer.', ['Phone call', 'Instagram DM', 'Website enquiry form', 'Store visit / directions', 'Email', 'No extra channels'], ['Phone call', 'Store visit / directions']),
    radio('reservation', 'How should reservations work?', 'For one-of-one stock, a reservation must be visible and expire under an agreed rule.', [['Staff confirms a hold', 'A click is an enquiry, not an automatic reservation.'], ['Timed online reservation', 'Lock stock for a limited period; define abuse controls.'], ['Deposit-backed reservation', 'Requires deposit collection and cancellation terms.']], 'Staff confirms a hold'),
    text('hold_rules', 'What are the reservation and cancellation rules?', 'Define the hold duration, deposit if any, expiry and who can release a hold.', '', true),
    checks('payments', 'Which payment methods does Shah actually accept?', 'COD is advertised. Other methods remain unconfirmed.', ['Cash on delivery', 'Cash in store', 'Bank transfer', 'Easypaisa', 'JazzCash', 'Online card payment', 'Installments'], ['Cash on delivery']),
    radio('customer_accounts', 'Do shoppers need accounts?', 'Guest enquiries keep the first release simple.', [['Guest shopping', 'No account needed to browse, enquire or request.'], ['Optional accounts', 'Save favorites and track requests.'], ['Required for orders', 'Adds sign-up, login and account support.']], 'Guest shopping'),
    text('sales_process', 'Who handles enquiries and when?', 'Name the responsible role, actual response hours and any honest response-time commitment.', '', true)
  ]},
  { id: 'requests', title: 'Request a phone', subtitle: 'Turn “not in stock” into a useful, trackable lead without promising a device that is not available.', callout: 'Recommended flow: short request form → confirmation with request ID → protected admin inbox → staff follows up when a matching device is sourced.', questions: [
    radio('request_entry', 'How should phone requests be submitted?', 'The request feature is part of the launch scope.', [['Website form + admin inbox', 'Track the request in the admin, with an optional WhatsApp step.'], ['Guided step-by-step form', 'A few short screens for preferences and contact details.'], ['WhatsApp with structured message', 'Fastest version, but weaker request tracking.']], 'Website form + admin inbox'),
    checks('request_fields', 'What should a request ask for?', 'Keep required contact data minimal and useful.', ['Brand / model', 'Storage', 'Color preferences', 'Budget range', 'Minimum condition /10', 'Battery preference', 'PTA preference', 'Carrier / JV preference', 'Name', 'WhatsApp number', 'City', 'Wanted-by date', 'Extra notes'], ['Brand / model', 'Storage', 'Budget range', 'Minimum condition /10', 'PTA preference', 'Carrier / JV preference', 'Name', 'WhatsApp number', 'City', 'Extra notes']),
    radio('request_flexibility', 'Can the customer accept alternatives?', 'Allow “flexible” for storage, color or model rather than forcing exact matches.', ['Yes, with preference choices', 'Only exact model requests', 'Staff asks later'], 'Yes, with preference choices'),
    radio('request_notify', 'How does the team receive a new request?', 'The admin inbox remains the source of truth for form submissions.', ['Admin inbox + email alert', 'Admin inbox only', 'Admin inbox + WhatsApp API alert'], 'Admin inbox + email alert'),
    checks('request_states', 'Which request statuses should the admin support?', 'Use explicit statuses instead of losing requests in chat history.', ['New', 'Contacted', 'Sourcing', 'Match found', 'Customer notified', 'Fulfilled', 'Cancelled'], ['New', 'Contacted', 'Sourcing', 'Match found', 'Customer notified', 'Fulfilled', 'Cancelled']),
    radio('request_followup', 'How should matching-stock follow-up work?', 'Notifications require a channel the customer agreed to use.', [['Manual follow-up', 'Staff reviews the match before contacting the customer.'], ['Suggested matches in admin', 'Software suggests candidates; staff sends the message.'], ['Automatic notifications', 'Requires reliable matching, consent and notification delivery.']], 'Suggested matches in admin'),
    radio('request_fee', 'Is requesting a phone free?', 'Do not collect money until pricing, sourcing and refund rules are agreed.', ['Free request, no commitment', 'Paid sourcing deposit', 'Discuss with business'], 'Free request, no commitment'),
    text('request_terms', 'What should customers expect after requesting?', 'Define actual follow-up time, how long a request stays open, and whether a match is guaranteed.', '', true)
  ]},
  { id: 'admin', title: 'Admin & uploads', subtitle: 'A practical control center for the people adding stock and managing leads every day.', callout: 'The real admin needs server-checked authentication and permissions. Customer pages must never receive purchase costs, profit margins, full identifiers, or private customer information.', questions: [
    radio('admin_users', 'Who will use the admin?', 'Choose roles that reflect the actual team.', [['Owner + stock staff', 'Owner manages settings; staff manages inventory and requests.'], ['One owner account', 'Simplest team setup.'], ['Owner + staff + sales', 'More granular editing and customer-management permissions.']], 'Owner + stock staff'),
    radio('admin_login', 'How should admin sign-in work?', 'Never use a password hidden only in the frontend.', [['Email + password + MFA', 'Invite-based accounts with a second factor.'], ['Email magic link', 'A short-lived sign-in link; restrict allowed accounts.'], ['Google sign-in', 'Restrict access to the approved team accounts.']], 'Email + password + MFA'),
    radio('admin_entry', 'What is the stock-entry workflow?', 'Drafts let staff complete media and inspection details before making a phone public.', [['Draft → preview → publish', 'Validate required fields at publication.'], ['One-screen quick add', 'Save a complete listing in one screen.'], ['Guided multi-step add', 'Device → inspection → media → price → publish.']], 'Draft → preview → publish'),
    checks('admin_tools', 'Which admin tools belong in the first release?', 'Core inventory, request and media tools are required by your brief.', ['Add / edit / archive devices', 'Available / reserved / sold states', 'Featured picks', 'Photo / video management', 'Requests inbox', 'Price updates', 'Bulk CSV import / export', 'Duplicate a listing', 'Private purchase cost / margin', 'Home content editor', 'Inspection checklist', 'Activity log', 'Team account management'], ['Add / edit / archive devices', 'Available / reserved / sold states', 'Featured picks', 'Photo / video management', 'Requests inbox', 'Price updates', 'Duplicate a listing', 'Private purchase cost / margin', 'Inspection checklist', 'Activity log', 'Team account management']),
    radio('upload_flow', 'How should photos and videos be added?', 'Store originals privately where needed and publish optimized derivatives.', [['Phone-friendly direct upload', 'Camera-roll upload, progress and cover selection.'], ['Desktop drag and drop', 'Useful for a dedicated stock operator.'], ['Both mobile and desktop', 'More flexibility for the team.']], 'Both mobile and desktop'),
    radio('video_policy', 'How should product videos be managed?', 'Avoid autoplaying every listing; define limits and produce web-friendly versions.', ['Direct upload, compressed playback', 'Paste a hosted video link', 'Support uploads and hosted links'], 'Direct upload, compressed playback'),
    text('upload_limits', 'What media limits fit your workflow?', 'Agree photo count, file types, video length, maximum file size and crop ratio.', 'Up to 10 photos; JPEG/PNG/WebP; one video up to 60 seconds; 25 MB video source limit; 4:5 cover crop', true),
    radio('publish_permissions', 'Can staff publish immediately?', 'Publishing affects what customers believe is available.', ['Owner approval for publishing', 'Trusted staff can publish', 'Separate editor and publisher roles'], 'Trusted staff can publish'),
    radio('admin_delete', 'How should mistakes and deletions be handled?', 'A recoverable archive makes routine corrections easier.', ['Archive + restore + activity log', 'Archive + restore', 'Owner-only permanent deletion'], 'Archive + restore + activity log'),
    text('admin_reporting', 'Which business reports are useful?', 'Examples: stock age, enquiries per listing, sold devices and private margin totals. Separate essentials from later requests.', '', true)
  ]},
  { id: 'policies', title: 'Trust & policies', subtitle: 'Make the store information and customer promises consistent, precise and approved by Shah.', callout: 'Two findings need resolution: the current Instagram bio advertises 7 days, while your summary says 3; the location reel says 10:30 PM, while your summary says 10 PM. A public mention is not a complete policy.', questions: [
    text('store_address', 'Confirm the exact current store address.', 'Verified in the location reel. Keep the shop number in addition to the market map.', 'Shop E-40, 1st Floor, Saima Mobile Market, Johar Mor, Block 10-A, Gulshan-e-Iqbal, Karachi', true),
    radio('store_hours', 'Which opening hours are current?', 'The location reel says 4:00–10:30 PM and Sunday closed.', [['Mon–Sat, 4 PM–10:30 PM', 'Matches the public location post.'], ['Mon–Sat, 4 PM–10 PM', 'Matches your supplied summary.'], ['Other / confirm with Shah', 'Add exact hours and exceptions below.']], 'Mon–Sat, 4 PM–10:30 PM'),
    radio('warranty_days', 'Which checking / return period is approved?', 'Confirm whether exchange and return are both included and when the period begins.', [['7 days', 'Matches the current Instagram bio.'], ['3 days', 'Matches your supplied summary.'], ['Different per device / confirm', 'Terms must be explicit on each listing.']], '7 days'),
    text('warranty_terms', 'What are the exact checking, exchange and return terms?', 'Define coverage, faults, battery expectations, exclusions, refund vs exchange, start date and shipping charges. Add owner-approved wording.', '', true),
    checks('fulfillment', 'Which delivery and pickup options are confirmed?', 'COD nationwide is publicly advertised. Confirm actual areas and restrictions.', ['Pakistan-wide shipping', 'Cash on delivery', 'Store pickup', 'Karachi same-day delivery', 'Appointment / viewing', 'International delivery'], ['Pakistan-wide shipping', 'Cash on delivery']),
    text('delivery_terms', 'What are the delivery charges, timing and courier rules?', 'Include remote areas, deposits, parcel inspection, loss / damage handling and estimated time windows.', '', true),
    checks('trust_content', 'Which real trust content can we use?', 'Use genuine evidence and permissioned customer material.', ['Owner introduction', 'Store photos / tour', 'Actual inspection process', 'Customer reviews with permission', 'Dispatch / packing clips', 'FAQ on PTA / carrier status', 'Policy pages', 'Payment / delivery guidance'], ['Owner introduction', 'Store photos / tour', 'Actual inspection process', 'Customer reviews with permission', 'Policy pages', 'Payment / delivery guidance']),
    text('policy_exceptions', 'Any other policies or operational exceptions?', 'Include holidays, pricing changes, reservations, exchanges, sale devices and whether trade-ins are offered.', '', true),
    text('privacy_retention', 'How long should request and order data be kept?', 'Choose a practical retention period, who can view it, and a contact for deletion requests.', 'Open requests: 90 days; closed requests: delete contact data after 180 days unless needed for an active transaction; owner to confirm', true)
  ]},
  { id: 'content', title: 'Social & content', subtitle: 'Bring the existing social presence into a polished website without letting old posts become misleading stock listings.', callout: 'Instagram highlights already organize Stock Available, Feedback, Dispatching, Shop and Accessories. The website can turn those themes into clearer, searchable content.', questions: [
    text('instagram_url', 'Confirm the official Instagram link.', 'This is the public profile you supplied and the profile linked from the business Linktree.', 'https://www.instagram.com/iphones_by_shah/'),
    text('facebook_url', 'Confirm the official Facebook page.', 'The public intro and stock post share the verified WhatsApp number.', 'https://www.facebook.com/p/Iphones-By-Shah-61558806308817/'),
    text('tiktok_url', 'Confirm the TikTok link.', 'Linked from the official Linktree; individual TikTok posts were not reviewed.', 'https://www.tiktok.com/@iphones_by_shah'),
    radio('social_display', 'How should Instagram content appear?', 'Stock availability comes from inventory records, not automatically from a post caption.', [['Curated reel / post links', 'Owner selects content; polished covers, no live API dependency.'], ['Official embedded posts', 'Requires third-party loading and a fallback.'], ['Automatic connected feed', 'Requires account permissions, tokens and maintenance.']], 'Curated reel / post links'),
    radio('site_language', 'What language should the customer site use?', 'This planning page and the admin copy are in English. Roman Urdu is optional for the shop’s public tone.', [['English + occasional Roman Urdu', 'A clean interface with some familiar local personality.'], ['English only', 'Keep all website copy in English.'], ['English / Urdu language switch', 'Needs translations and right-to-left layouts.']], 'English + occasional Roman Urdu'),
    radio('copy_tone', 'How should the website sound?', 'Social captions are energetic and price-led. Choose how much of that energy carries over.', ['Premium, friendly and direct', 'Bold, playful and deal-led', 'Minimal and formal'], 'Premium, friendly and direct'),
    checks('content_ownership', 'Who supplies the launch content?', 'Confirm which items are ready and who owns the remaining work.', ['Business supplies actual device photos', 'Business supplies condition videos', 'Business approves product copy', 'Business provides policy wording', 'Business provides permitted reviews', 'Developer writes draft brand copy', 'New store photos needed', 'Logo refinement needed'], ['Business supplies actual device photos', 'Business supplies condition videos', 'Business approves product copy', 'Business provides policy wording', 'Business provides permitted reviews', 'Developer writes draft brand copy']),
    text('social_rights', 'Which posts, photos and reviews are approved for reuse?', 'Paste selected post links and record permission for customer images or reviews. This is a planning record, not a permissions request sent to anyone.', '', true),
    text('content_examples', 'Any custom headline, FAQ, promotion or brand story?', 'Add copy you want included and anything that must never appear.', '', true)
  ]},
  { id: 'launch', title: 'Build & launch', subtitle: 'Turn the creative direction into a realistic first release, then keep room for improvements.', callout: 'Recommended first release: responsive showroom + accurate stock + device details + WhatsApp enquiries + tracked phone requests + protected admin. Full checkout and automated social integrations can be separate phases.', questions: [
    radio('release_scope', 'How ambitious should the first release be?', 'Stock, device condition, requests and admin remain the core scope.', [['Focused premium launch', 'Build the core experience first, with polished 3D.'], ['Full commerce launch', 'Include checkout, payments, orders and fulfillment.'], ['Core launch + richer second phase', 'Ship the essentials, then extend from real feedback.']], 'Focused premium launch'),
    checks('later_features', 'Which features can wait for phase two?', 'Keep extras out of the initial launch unless they are essential.', ['Online card checkout', 'Trade-in estimator', 'Automated social feed', 'Back-in-stock alerts', 'Customer accounts', 'Loyalty / referral program', 'Advanced analytics', 'Installment integration', 'No phase-two extras yet'], ['Online card checkout', 'Automated social feed', 'Back-in-stock alerts', 'Customer accounts']),
    radio('build_approach', 'Do you have a build approach preference?', 'The final technical choice should follow the confirmed scope and hosting needs.', [['Developer recommends the stack', 'Choose a maintainable stack after decisions are complete.'], ['Custom React / Next.js', 'Custom frontend with a managed database and media storage.'], ['Commerce platform', 'Use an established platform where individual-device records fit.']], 'Developer recommends the stack'),
    text('domain', 'What domain should be used, and who owns it?', 'Enter a domain you already control or candidate names to check. Availability is not assumed.'),
    text('hosting', 'Any existing hosting, database or email services?', 'Names and preferences only; do not put passwords, API keys or private credentials in this planning page.', '', true),
    radio('budget_range', 'What build budget should guide the scope?', 'These are planning brackets, not a quote.', ['Under PKR 100,000', 'PKR 100,000–250,000', 'PKR 250,000–500,000', 'PKR 500,000+', 'Not decided yet']),
    text('launch_date', 'What is the target launch date?', 'State a date or deadline and any event it must align with.'),
    checks('launch_checks', 'Which acceptance checks should be required?', 'Review with real devices, real stock and real admin permissions.', ['Mobile catalogue works smoothly', '3D has a fast poster fallback', 'Reduced motion is respected', 'Keyboard / accessible forms', 'Sold phones cannot be ordered', 'Only approved admins can edit', 'Photos / videos upload reliably', 'Requests reach the right inbox', 'Policies approved by owner', 'Search / share previews work', 'Backup and restore documented', 'Staff training completed'], ['Mobile catalogue works smoothly', '3D has a fast poster fallback', 'Reduced motion is respected', 'Keyboard / accessible forms', 'Sold phones cannot be ordered', 'Only approved admins can edit', 'Photos / videos upload reliably', 'Requests reach the right inbox', 'Policies approved by owner', 'Search / share previews work', 'Backup and restore documented', 'Staff training completed']),
    radio('maintenance', 'Who maintains the website after launch?', 'Separate daily stock entry from technical maintenance and backups.', ['Business handles stock, developer handles technical care', 'Business handles everything after handover', 'Ongoing managed service'], 'Business handles stock, developer handles technical care'),
    text('final_notes', 'Anything else the website needs to do?', 'Add integrations, reports, accessibility needs, launch risks or unanswered questions.', '', true)
  ]}
];
const allQuestions = chapters.flatMap(chapter => chapter.questions);
const questionMap = new Map(allQuestions.map(question => [question.id, question]));
const storageKey = 'shah.website-blueprint.v1';
let answers = {};
let notes = {};
let currentChapter = 0;
let currentView = 'vision';
let saveTimer;
let toastTimer;
let rotating = false;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const hasAnswer = question => Object.hasOwn(answers, question.id) && (Array.isArray(answers[question.id]) ? true : String(answers[question.id]).trim() !== '');
const hasNote = question => typeof notes[question.id] === 'string' && notes[question.id].trim() !== '';
const hasResponse = question => hasAnswer(question) || hasNote(question);
const valueOf = id => Object.hasOwn(answers, id) ? answers[id] : questionMap.get(id)?.recommended;
const formatValue = value => Array.isArray(value) ? (value.length ? value.join(', ') : 'None selected') : String(value ?? '');

function validateAnswers(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The answer file is not valid.');
  const clean = {};
  for (const question of allQuestions) {
    if (!Object.hasOwn(raw, question.id)) continue;
    const value = raw[question.id];
    if (question.type === 'checkbox') {
      if (!Array.isArray(value) || value.some(item => !question.options.some(opt => opt.value === item))) throw new Error(`Invalid choices for ${question.title}`);
      clean[question.id] = [...new Set(value)];
    } else if (question.type === 'radio') {
      if (!question.options.some(opt => opt.value === value)) throw new Error(`Invalid choice for ${question.title}`);
      clean[question.id] = value;
    } else if (question.type === 'range') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < question.min || value > question.max || Math.abs((value - question.min) / question.step - Math.round((value - question.min) / question.step)) > .0001) throw new Error(`Invalid number for ${question.title}`);
      clean[question.id] = value;
    } else {
      if (typeof value !== 'string' || value.length > 10000) throw new Error(`Invalid text for ${question.title}`);
      if (value.trim()) clean[question.id] = value;
    }
  }
  return clean;
}
function migrateAnswers(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const migrated = { ...raw };
  if (Array.isArray(migrated.categories)) migrated.categories = migrated.categories.filter(value => value !== 'Google Pixel');
  if (Array.isArray(migrated.audience)) migrated.audience = migrated.audience.map(value => value === 'Google Pixel buyers' ? 'iPhone Pro Max buyers' : value);
  if (migrated.side_models === '16 + a Google Pixel') migrated.side_models = '18 + iPhone 16 Pro Max';
  return migrated;
}
function validateNotes(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The notes are not valid.');
  const clean = {};
  for (const question of allQuestions) {
    if (!Object.hasOwn(raw, question.id)) continue;
    const value = raw[question.id];
    if (typeof value !== 'string' || value.length > 10000) throw new Error(`Invalid notes for ${question.title}`);
    if (value.trim()) clean[question.id] = value;
  }
  return clean;
}
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved?.version === 1) {
    answers = validateAnswers(migrateAnswers(saved.answers));
    notes = validateNotes(saved.notes ?? {});
  }
} catch { $('#save-state').innerHTML = '<i></i> Local saving unavailable'; }

function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3300);
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), answers, notes }));
      $('#save-state').innerHTML = '<i></i> Saved on this browser';
    } catch { $('#save-state').innerHTML = '<i></i> Export to keep your answers'; }
  }, 200);
  updateProgress();
  applyStyle();
}
function switchView(view, shouldScroll = true) {
  if (!['vision', 'decisions', 'brief'].includes(view)) return;
  currentView = view;
  for (const id of ['vision', 'decisions', 'brief']) {
    $(`#${id}`).hidden = id !== view;
    $(`#tab-${id}`).setAttribute('aria-selected', String(id === view));
    $(`#tab-${id}`).tabIndex = id === view ? 0 : -1;
  }
  if (view === 'brief') renderBrief();
  if (view !== 'vision') setRotation(false);
  if (shouldScroll) window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  try { history.replaceState(null, '', view === 'vision' ? location.pathname : `#${view}`); } catch { /* File viewers may restrict history changes; the tabs still work. */ }
}
function updateProgress() {
  const count = allQuestions.filter(hasResponse).length;
  const percent = Math.round(count / allQuestions.length * 100);
  $('#decision-badge').textContent = count;
  $('#progress-text').textContent = `${count} of ${allQuestions.length} decisions made`;
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-bar').style.width = `${percent}%`;
  for (const [index, chapter] of chapters.entries()) {
    const button = $(`#chapter-nav-${chapter.id}`);
    if (button) button.querySelector('.count').textContent = `${chapter.questions.filter(hasResponse).length}/${chapter.questions.length}`;
    button?.classList.toggle('active', index === currentChapter);
    if (button) button.setAttribute('aria-current', index === currentChapter ? 'step' : 'false');
  }
}
function renderNav() {
  $('#chapter-nav').innerHTML = chapters.map((chapter, index) => `<button class="chapter-button ${index === currentChapter ? 'active' : ''}" id="chapter-nav-${chapter.id}" data-chapter="${chapter.id}" aria-current="${index === currentChapter ? 'step' : 'false'}"><span class="num">${String(index + 1).padStart(2, '0')}</span><span>${chapter.title}</span><span class="count">0/${chapter.questions.length}</span></button>`).join('');
}
function renderQuestion(question, index) {
  const answered = hasAnswer(question);
  const title = `<span class="q-number">${String(index + 1).padStart(2, '0')}</span>${escapeHTML(question.title)}`;
  const description = `<p class="q-desc" id="desc-${question.id}">${escapeHTML(question.description)}</p>`;
  let control;
  if (question.type === 'radio' || question.type === 'checkbox') {
    control = `<div class="choices ${question.type}">${question.options.map((opt, optionIndex) => {
      const checked = answered && (question.type === 'radio' ? answers[question.id] === opt.value : answers[question.id].includes(opt.value));
      const recommended = question.type === 'radio' ? question.recommended === opt.value : question.recommended.includes(opt.value);
      return `<label class="choice" for="${question.id}-${optionIndex}"><input id="${question.id}-${optionIndex}" type="${question.type}" name="${question.id}" value="${escapeHTML(opt.value)}" ${checked ? 'checked' : ''} aria-describedby="desc-${question.id}"><span><b>${escapeHTML(opt.label)}</b>${opt.description ? `<small>${escapeHTML(opt.description)}</small>` : ''}${recommended ? '<small class="recommended">Recommended</small>' : ''}</span></label>`;
    }).join('')}</div>`;
    if (question.type === 'checkbox') control += `<div class="suggestion"><button type="button" data-none="${question.id}">Choose none</button><span>Multiple choices allowed</span></div>`;
  } else if (question.type === 'range') {
    const value = answered ? answers[question.id] : question.recommended;
    control = `<div class="range-row"><input id="input-${question.id}" type="range" name="${question.id}" min="${question.min}" max="${question.max}" step="${question.step}" value="${value}" aria-label="${escapeHTML(question.title)}" aria-describedby="desc-${question.id}"><output for="input-${question.id}" id="output-${question.id}">${value}${question.suffix}</output></div>${!answered ? '<p class="suggestion">Recommended preview value; move the slider or use the recommendation to choose it.</p>' : ''}`;
  } else {
    control = question.type === 'textarea' ? `<textarea class="text-answer" id="input-${question.id}" name="${question.id}" aria-label="${escapeHTML(question.title)}" aria-describedby="desc-${question.id}" maxlength="10000" placeholder="Your answer…">${escapeHTML(answered ? answers[question.id] : '')}</textarea>` : `<input class="text-answer" id="input-${question.id}" name="${question.id}" type="text" aria-label="${escapeHTML(question.title)}" aria-describedby="desc-${question.id}" maxlength="10000" value="${escapeHTML(answered ? answers[question.id] : '')}" placeholder="Your answer…">`;
    if (question.recommended) control += `<div class="suggestion"><span>Suggested: ${escapeHTML(question.recommended)}</span><button type="button" data-recommend="${question.id}">Use this</button></div>`;
  }
  const ownWords = `<div class="question-notes"><label for="notes-${question.id}">Your own answer or notes <span>OPTIONAL</span></label><textarea class="text-answer note-answer" id="notes-${question.id}" data-note-for="${question.id}" maxlength="10000" placeholder="Add your own answer, explain your choice, or tell us something else…">${escapeHTML(notes[question.id] || '')}</textarea></div>`;
  return `<fieldset class="question" data-question="${question.id}"><legend>${title}</legend>${description}${control}<button class="clear-answer" type="button" data-clear="${question.id}">${answered ? 'Clear this answer' : 'Leave open / clear'}</button>${ownWords}</fieldset>`;
}
function renderChapter(scroll = false) {
  const chapter = chapters[currentChapter];
  $('#chapter-content').innerHTML = `<div class="chapter-header"><div><span class="eyebrow">${String(currentChapter + 1).padStart(2, '0')} / YOUR DECISIONS</span><button class="button light chapter-recommend" id="chapter-recommend">Use chapter recommendations ↗</button></div><h2 tabindex="-1" id="chapter-heading">${chapter.title}</h2><p>${chapter.subtitle}</p></div><div class="chapter-callout"><b>THE THINKING / </b>${chapter.callout}</div>${chapter.id === 'visual' ? '<div class="live-style"><span class="micro">LIVE STYLE PREVIEW · SUGGESTIONS UNTIL CHOSEN</span><div class="swatches"><i style="background:var(--bg)"></i><i style="background:var(--ink)"></i><i style="background:var(--accent)"></i></div><div class="live-headline" id="live-headline"></div><p id="live-style-caption"></p></div>' : ''}<form id="chapter-form">${chapter.questions.map(renderQuestion).join('')}</form>`;
  $('#prev-chapter').disabled = currentChapter === 0;
  $('#next-chapter').textContent = currentChapter === chapters.length - 1 ? 'Review brief ↗' : 'Next chapter →';
  $('#chapter-position').textContent = `${currentChapter + 1} / ${chapters.length}`;
  updateProgress();
  applyStyle();
  if (scroll) {
    $('#chapter-content').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    $('#chapter-heading').focus({ preventScroll: true });
  }
}
function applyStyle() {
  const direction = valueOf('visual_direction') || 'White studio';
  const accent = valueOf('accent') || 'Shah orange';
  document.documentElement.style.setProperty('--bg', direction === 'Warm editorial' ? '#fbf8f2' : direction === 'Pure monochrome' ? '#ffffff' : '#f9f9f6');
  document.documentElement.style.setProperty('--accent', accent === 'Burgundy' ? '#793947' : accent === 'Graphite' ? '#535550' : '#c88744');
  document.documentElement.style.setProperty('--accent-pale', accent === 'Burgundy' ? '#f4e9ed' : accent === 'Graphite' ? '#edeeeb' : '#f6eee4');
  const headline = valueOf('headline') || 'Your next phone. A whole new feeling.';
  if ($('#live-headline')) $('#live-headline').textContent = headline;
  if ($('#live-style-caption')) $('#live-style-caption').textContent = `${direction} · ${accent} · iPhone 18 Pro Max at the center`;
}
const illustrativeStock = [
  { brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '256 GB', color: 'Natural Titanium', grade: '9.5', battery: '94%', price: '122,500', style: '', status: 'Non-PTA · Unlocked' },
  { brand: 'Apple', model: 'iPhone 14 Pro', storage: '128 GB', color: 'Deep Purple', grade: '9', battery: '89%', price: '97,500', style: 'blue', status: 'PTA approved · Unlocked' },
  { brand: 'Apple', model: 'iPhone 16 Pro Max', storage: '256 GB', color: 'Black Titanium', grade: '9.5', battery: '96%', price: '270,000', style: 'black', status: 'Non-PTA · Unlocked' }
];
function renderStock(filter = 'all') {
  const stock = illustrativeStock.filter(item => filter === 'all' || (filter === 'pro-max' ? item.model.includes('Pro Max') : item.model.includes('Pro') && !item.model.includes('Pro Max')));
  $('#stock-grid').innerHTML = stock.map(item => `<article class="stock-card"><div class="stock-visual" aria-label="Illustrative ${item.model} silhouette"><span>ILLUSTRATIVE DEVICE</span><div class="mini-phone ${item.style}" aria-hidden="true"><i></i><i></i><i></i></div></div><h3>${item.model}</h3><p class="meta">${item.storage} · ${item.color}<br>${item.status}</p><div class="stock-stats"><span>Condition <b>${item.grade}/10</b></span><span>Battery <b>${item.battery}</b></span></div><div class="card-price">PKR ${item.price}<span>DEMO PRICE</span></div></article>`).join('');
  $('#stock-count').textContent = `${stock.length} illustrative listing${stock.length === 1 ? '' : 's'}`;
  $$('[data-filter]').forEach(button => { button.classList.toggle('active', button.dataset.filter === filter); button.setAttribute('aria-pressed', String(button.dataset.filter === filter)); });
}
function renderAdmin(screen = 'inventory') {
  if (screen === 'inventory') $('#admin-preview').innerHTML = '<div class="admin-kpis"><div><small>Available / demo</small><b>24</b></div><div><small>Reserved / demo</small><b>03</b></div><div><small>Requests / demo</small><b>08</b></div></div><div class="admin-row"><span><b>iPhone 15 Pro Max</b><small>IBS-024 · 256 GB · 9.5/10</small></span><span class="status">Available</span></div><div class="admin-row"><span><b>iPhone 16 Pro Max</b><small>IBS-023 · 256 GB · 9.5/10</small></span><span class="status amber">Reserved</span></div><div class="admin-row"><span><b>iPhone 14 Pro</b><small>IBS-022 · 128 GB · 9/10</small></span><span class="status">Available</span></div>';
  if (screen === 'requests') $('#admin-preview').innerHTML = '<div class="admin-kpis"><div><small>New / demo</small><b>03</b></div><div><small>Sourcing / demo</small><b>04</b></div><div><small>Matched / demo</small><b>01</b></div></div><div class="admin-row"><span><b>iPhone 15 Pro · 256 GB</b><small>Request R-008 · Preferred condition 9+/10</small></span><span class="status amber">Sourcing</span></div><div class="admin-row"><span><b>iPhone 16 Pro Max · Flexible color</b><small>Request R-007 · Budget PKR 300,000</small></span><span class="status">Match found</span></div><div class="admin-row"><span><b>iPhone 13 · PTA approved</b><small>Request R-006 · Staff follow-up pending</small></span><span class="status amber">New</span></div>';
  if (screen === 'media') $('#admin-preview').innerHTML = '<div class="admin-kpis"><div><small>Photos / demo</small><b>06</b></div><div><small>Video / demo</small><b>01</b></div><div><small>Cover selected</small><b>✓</b></div></div><div class="media-demo"><div class="media-tile"><div class="mini-phone"><i></i><i></i><i></i></div><span>Back / cover</span></div><div class="media-tile"><div class="mini-phone blue"><i></i><i></i><i></i></div><span>Edge close-up</span></div><div class="media-tile"><div class="mini-phone black"><i></i><i></i><i></i></div><span>Condition video</span></div></div>';
  $$('[data-admin]').forEach(button => { button.classList.toggle('active', button.dataset.admin === screen); button.setAttribute('aria-pressed', String(button.dataset.admin === screen)); });
}

const researchSources = [
  ['Instagram profile: identity, delivery and advertised 7-day guarantee', 'https://www.instagram.com/iphones_by_shah/'],
  ['Location reel: address, 4 PM–10:30 PM hours, Sunday closed, both numbers', 'https://www.instagram.com/iphones_by_shah/reel/DWRsClNDtXS/'],
  ['10 October 2026 stock reel: iPhone 15 Pro Max 256GB, advertised PKR 122,500', 'https://www.instagram.com/iphones_by_shah/reel/DeUCrCcO-aW/'],
  ['Facebook intro and public stock posts', 'https://www.facebook.com/p/Iphones-By-Shah-61558806308817/'],
  ['PTA-approved iPhone 13 promotion: advertised PKR 84,200, dated stock example', 'https://www.facebook.com/reel/1515653526530830/'],
  ['Official Linktree: WhatsApp, Instagram, TikTok and market map', 'https://linktr.ee/iphones_by_shah'],
  ['Market map linked by the business; not a verified shop-specific listing', 'https://maps.app.goo.gl/uF7U7AeRosRMkBkz8?g_st=ic']
];
function scopeNotes() {
  const flow = valueOf('purchase_flow');
  const sides = valueOf('side_models');
  return [
    sides === 'Keep the 18 alone' ? 'Home with the supplied logo and the iPhone 18 Pro Max as the solo hero.' : sides === '18 + iPhone 16 Pro Max' ? 'Home with the supplied logo; iPhone 18 Pro Max at the center, with the supplied iPhone 16 Pro Max beside it.' : 'Home with the supplied logo and the three supplied phone models; iPhone 18 Pro Max at the center and iPhone 16 Pro Max as a supporting phone.',
    'Current stock as the primary CTA and a prominent homepage section.',
    'Individual device pages with condition /10, actual media and clear device disclosures.',
    flow === 'Full online checkout' ? 'Online checkout requires payments, transactional stock locking, order states, fulfillment and agreed refund rules.' : flow === 'Website order request + COD' ? 'Order requests require contact validation, staff availability confirmation and delivery / COD terms.' : 'Prepared WhatsApp enquiries carry the stock ID, model and advertised price; staff confirms availability.',
    'Phone request workflow with preferences, contact details and staff follow-up.',
    'Protected admin for inventory, requests, image / video uploads, availability and team permissions.',
    'Responsive layouts, poster fallbacks, reduced motion, search indexing, share previews and handover.'
  ];
}
function dependencies() {
  const issues = [];
  if (!hasAnswer(questionMap.get('warranty_days')) || !hasAnswer(questionMap.get('warranty_terms'))) issues.push('Resolve the 7-day vs 3-day policy difference and obtain the exact owner-approved terms.');
  if (!hasAnswer(questionMap.get('store_hours'))) issues.push('Confirm 10:30 PM vs 10 PM closing time before publishing store hours.');
  if (!hasAnswer(questionMap.get('grading_rules'))) issues.push('Define the condition /10 rubric and the actual inspection checks.');
  if (!hasAnswer(questionMap.get('delivery_terms'))) issues.push('Confirm shipping charges, timing, COD restrictions and return-shipping rules.');
  if (!hasAnswer(questionMap.get('stock_volume'))) issues.push('Agree launch inventory volume and responsibility for stock updates.');
  if (!hasAnswer(questionMap.get('social_rights'))) issues.push('Select approved social content and customer reviews; confirm reuse permissions.');
  if (!hasAnswer(questionMap.get('domain'))) issues.push('Choose the domain and confirm ownership / availability.');
  if (!hasAnswer(questionMap.get('launch_date'))) issues.push('Agree target date and delivery milestones.');
  if (valueOf('purchase_flow') === 'Full online checkout') issues.push('Select payment / courier services and specify stock locking, payment failure, cancellation and refunds.');
  if (valueOf('reservation') !== 'Staff confirms a hold') issues.push('Define reservation duration, atomic stock locking, expiry and any deposit / refund rules.');
  if (valueOf('social_display') === 'Automatic connected feed') issues.push('Confirm business-account access, official social integration permissions and feed maintenance.');
  issues.push('Confirm usage terms for the supplied iPhone 18 and Duo model archives before the actual store launch.');
  return issues;
}
function renderBrief() {
  const made = allQuestions.filter(hasResponse).length;
  const open = allQuestions.length - made;
  $('#brief-status').innerHTML = `<b>${made} / ${allQuestions.length} decisions recorded</b><span>${open} open · Recommendations are not treated as approved choices</span>`;
  $('#brief-content').innerHTML = `<div class="brief-overview"><article><span class="eyebrow">THE CORE EXPERIENCE</span><h3 style="margin-top:16px">A premium showroom.<br>A practical stock engine.</h3><ul>${scopeNotes().map(note => `<li>${escapeHTML(note)}</li>`).join('')}</ul><p>Suggested direction: ${escapeHTML(valueOf('visual_direction'))} / ${escapeHTML(valueOf('accent'))}. Values below show exactly what you have chosen.</p></article><article><span class="eyebrow">BEFORE THE STORE LAUNCHES</span><h3 style="margin-top:16px">Open work & dependencies</h3><ul>${dependencies().map(issue => `<li>${escapeHTML(issue)}</li>`).join('')}</ul></article></div><div class="brief-block"><h3><span>BUILD</span>Suggested delivery sequence</h3><p class="muted" style="font-size:12px">1. Confirm business details and this brief → 2. Finalize design / optimized 3D → 3. Build stock, detail and request pages → 4. Build protected admin, database and media storage → 5. Add real stock and owner-approved content → 6. Verify device accuracy, access, mobile performance and staff workflow → 7. Launch and hand over.</p></div><div class="brief-block"><h3><span>SYSTEM</span>Suggested implementation plan</h3><p class="muted" style="font-size:12px">A responsive public catalogue reads published inventory from a database-backed service. A separately protected admin manages devices and requests through server-checked permissions. Photos and videos use object storage with optimized display versions. Private costs, full identifiers and customer contact details stay outside public responses.</p><div class="system-table"><div><b>Device / stock unit</b><span>Public ID, model, storage, color, price, condition, battery, PTA / carrier status, disclosures, publish state and availability. Private purchase cost and identifiers are restricted.</span></div><div><b>Device media</b><span>Linked to a stock unit; photo / video type, cover, order, alt text and optimized asset location. Validate upload type and size, then compress for web playback.</span></div><div><b>Phone request</b><span>Preferences, budget, contact consent, private contact details, status, assigned staff and follow-up notes. Track a public request reference without exposing the inbox.</span></div><div><b>Team / activity</b><span>Approved accounts, roles and records of stock / status edits. Archive and restore keep routine mistakes recoverable.</span></div><div><b>Optional commerce</b><span>Reservations and orders only when selected. Recheck availability on submission, lock a unit atomically, handle expiry / cancellation and record payment / delivery states.</span></div></div><p class="question-extra">3D: show a poster immediately, load optimized models only when needed, cap rendering cost on mobile, pause off-screen motion and honor reduced motion. Index device pages, provide share images and preserve sold URLs with alternatives. This planning page uses browser-local answers; the future store requires durable server data.</p></div>${chapters.map((chapter, index) => `<section class="brief-block"><h3><span>${String(index + 1).padStart(2, '0')}</span>${chapter.title}</h3>${chapter.questions.map(question => {
    const chosen = hasAnswer(question);
    const custom = hasNote(question);
    const value = chosen ? formatValue(answers[question.id]) + (question.type === 'range' ? question.suffix : '') : custom ? 'Your own answer' : question.recommended !== undefined && formatValue(question.recommended) ? `Open — suggested: ${formatValue(question.recommended)}${question.type === 'range' ? question.suffix : ''}` : 'Open — your input needed';
    return `<div class="brief-answer"><span>${escapeHTML(question.title)}</span><div class="answer-value ${chosen || custom ? '' : 'answer-open'}">${escapeHTML(value)}${custom ? `<div class="brief-note"><b>${chosen ? 'YOUR NOTES' : 'CUSTOM ANSWER'}</b><p>${escapeHTML(notes[question.id])}</p></div>` : ''}</div><span class="answer-state">${chosen ? 'CHOSEN' : custom ? 'CUSTOM' : 'OPEN'}</span></div>`;
  }).join('')}</section>`).join('')}<section class="brief-block"><h3><span>REF</span>Research and evidence</h3><p class="muted" style="font-size:11px">Reviewed 11 October 2026. Public Instagram, selected reels, Facebook intro / visible posts and Linktree were inspected. Complete post history, gated highlights and TikTok posts were not audited. Dated advertised prices are not live inventory. Market-level map data must not be presented as shop-level ratings or hours.</p><ul style="font-size:11px">${researchSources.map(([title, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${escapeHTML(title)}</a></li>`).join('')}</ul></section>`;
}
function buildMarkdown() {
  const made = allQuestions.filter(hasResponse).length;
  const lines = ['# iPhones by Shah — Website build brief', '', `Exported: ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'long', timeStyle: 'short' }).format(new Date())} (Asia/Karachi)`, `Decisions recorded: ${made}/${allQuestions.length}. Unselected recommendations are not approved choices.`, '', '## Core scope', ...scopeNotes().map(note => `- ${note}`), '', '## Suggested delivery sequence', 'Confirm brief → design and 3D optimization → stock / device / requests → protected admin / database / media → real content → QA / staff training → launch / handover.', '', '## Suggested implementation plan', '- Public catalogue: published database-backed inventory only; private costs, complete identifiers and customer information never appear in public responses.', '- Protected admin: server-checked authentication and role permissions; device entry, inspection, media, pricing, availability, requests and recoverable archives.', '- Stock unit: ID, model, storage, color, selling price, condition /10, battery source, PTA and carrier status, disclosures, publication / availability states; private purchase cost and identifiers are restricted.', '- Media: linked to the individual stock unit; validate file type / size, optimize images and videos, select cover and order, provide alt text and object storage.', '- Requests: model / budget / preferences, consent, private contact details, status, assigned staff, follow-up and a public request reference.', '- Optional commerce: atomic availability checks / reservation locks, expiry, cancellation, payment failure, delivery and refunds only when selected.', '- 3D and performance: immediate poster, optimized lazy-loaded models, bounded rendering cost, motion paused off screen, reduced motion, mobile fallback; indexable pages and share previews.', '- Real store data requires durable server storage. This planning page saves decisions in the browser only.', '', '## Open work and dependencies', ...dependencies().map(issue => `- ${issue}`)];
  for (const chapter of chapters) {
    lines.push('', `## ${chapter.title}`);
    for (const question of chapter.questions) {
      const chosen = hasAnswer(question);
      const value = chosen ? `${formatValue(answers[question.id])}${question.type === 'range' ? question.suffix : ''}` : hasNote(question) ? 'CUSTOM — your own answer below' : question.recommended !== undefined && formatValue(question.recommended) ? `OPEN — suggested: ${formatValue(question.recommended)}${question.type === 'range' ? question.suffix : ''}` : 'OPEN — input needed';
      lines.push('', `### ${question.title}`, `${chosen ? 'CHOSEN: ' : ''}${value}`, `Context: ${question.description}`);
      if (hasNote(question)) lines.push('', 'Your own answer / notes:', notes[question.id]);
    }
  }
  lines.push('', '## Research sources', 'Reviewed 11 October 2026. Selected public posts inspected; no exhaustive post / highlight / TikTok audit. Dated prices are not live stock. Instagram currently advertises 7 days; supplied summary says 3. Location reel says 10:30 PM; supplied summary says 10 PM. Resolve policies with Shah before launch.', ...researchSources.map(([title, url]) => `- [${title}](${url})`), '', '## Assets', '- Supplied logo.png; existing tagline: The Name of Trust.', '- Supplied iPhone 18 Pro Max and Duo models: usage terms to confirm before launch.', '- iPhone 16 Pro Max by MajdyModels / Sketchfab, CC BY 4.0; original geometry displayed. https://sketchfab.com/3d-models/iphone-16-pro-max-41a071ae12794b668502f58d1e0fd1a3', '- Google model-viewer 4.1.0 (Apache 2.0): https://modelviewer.dev/', '', 'This document is a planning record. It does not deploy a store, confirm real-time stock, process an order or send a message.');
  return lines.join('\n');
}
function download(name, data, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function setRotation(enable) {
  rotating = enable && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('model-viewer').forEach(model => { if (rotating) model.setAttribute('auto-rotate', ''); else model.removeAttribute('auto-rotate'); });
  $('#rotate-toggle').setAttribute('aria-pressed', String(rotating));
  $('#rotate-toggle span').textContent = rotating ? 'Pause rotation' : 'Auto rotate';
}

document.addEventListener('click', event => {
  const view = event.target.closest('[data-view]');
  if (view) { switchView(view.dataset.view); return; }
  const chapter = event.target.closest('[data-chapter]');
  if (chapter) {
    currentChapter = chapters.findIndex(item => item.id === chapter.dataset.chapter);
    if (currentView !== 'decisions') switchView('decisions', false);
    renderChapter(true);
    return;
  }
  const recommended = event.target.closest('[data-recommend]');
  if (recommended) { const question = questionMap.get(recommended.dataset.recommend); answers[question.id] = question.recommended; save(); renderChapter(); return; }
  const clear = event.target.closest('[data-clear]');
  if (clear) { delete answers[clear.dataset.clear]; save(); renderChapter(); return; }
  const none = event.target.closest('[data-none]');
  if (none) { answers[none.dataset.none] = []; save(); renderChapter(); return; }
  const filter = event.target.closest('[data-filter]');
  if (filter) { renderStock(filter.dataset.filter); return; }
  const admin = event.target.closest('[data-admin]');
  if (admin) { renderAdmin(admin.dataset.admin); return; }
  if (event.target.closest('#chapter-recommend')) {
    let count = 0;
    for (const question of chapters[currentChapter].questions) {
      if (!hasResponse(question) && question.recommended !== undefined && formatValue(question.recommended)) {
        answers[question.id] = Array.isArray(question.recommended) ? [...question.recommended] : question.recommended;
        count++;
      }
    }
    save(); renderChapter(); notify(count ? `${count} recommendations chosen. Your existing answers were kept.` : 'No open recommendations in this chapter.'); return;
  }
});
document.addEventListener('input', event => {
  const input = event.target;
  if (!input.closest('#chapter-form')) return;
  if (input.dataset.noteFor && questionMap.has(input.dataset.noteFor)) {
    if (input.value.trim()) notes[input.dataset.noteFor] = input.value;
    else delete notes[input.dataset.noteFor];
    save();
    return;
  }
  if (!questionMap.has(input.name)) return;
  const question = questionMap.get(input.name);
  if (question.type === 'checkbox') {
    const exclusive = ['No decorative motion', 'No extra channels', 'No phase-two extras yet'];
    const inputs = $$(`#chapter-form input[name="${question.id}"]`);
    if (input.checked && exclusive.includes(input.value)) inputs.forEach(item => { item.checked = item === input; });
    else if (input.checked) inputs.filter(item => exclusive.includes(item.value)).forEach(item => { item.checked = false; });
    answers[question.id] = inputs.filter(item => item.checked).map(item => item.value);
  }
  else if (question.type === 'range') { answers[question.id] = Number(input.value); $(`#output-${question.id}`).textContent = input.value + question.suffix; }
  else if (question.type === 'radio') answers[question.id] = input.value;
  else if (input.value.trim()) answers[question.id] = input.value;
  else delete answers[question.id];
  const clearButton = input.closest('.question').querySelector('.clear-answer');
  clearButton.textContent = hasAnswer(question) ? 'Clear this answer' : 'Leave open / clear';
  save();
});
document.addEventListener('submit', event => { if (event.target.id === 'chapter-form') event.preventDefault(); });
$('#prev-chapter').addEventListener('click', () => { if (currentChapter > 0) { currentChapter--; renderChapter(true); } });
$('#next-chapter').addEventListener('click', () => { if (currentChapter < chapters.length - 1) { currentChapter++; renderChapter(true); } else switchView('brief'); });
$('#rotate-toggle').addEventListener('click', () => { setRotation(!rotating); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) notify('Reduced motion is enabled. Drag a phone to explore it.'); });
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) setRotation(false); });
$('#export-md').addEventListener('click', () => { download('iphones-by-shah-build-brief.md', buildMarkdown(), 'text/markdown;charset=utf-8'); notify('Build brief downloaded.'); });
$('#export-json').addEventListener('click', () => {
  download('iphones-by-shah-answers.json', JSON.stringify({ project: 'iPhones by Shah', version: 1, exportedAt: new Date().toISOString(), answers, notes, decisions: allQuestions.map(question => ({ id: question.id, question: question.title, status: hasAnswer(question) ? 'chosen' : hasNote(question) ? 'custom' : 'open', chosen: hasAnswer(question) ? answers[question.id] : null, notes: notes[question.id] || '', recommended: question.recommended ?? null })) }, null, 2), 'application/json;charset=utf-8');
  notify('Answers exported. Import this file to continue in another browser.');
});
$('#copy-brief').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(buildMarkdown()); notify('Build brief copied.'); }
  catch { download('iphones-by-shah-build-brief.md', buildMarkdown(), 'text/markdown;charset=utf-8'); notify('Clipboard unavailable. Your brief was downloaded instead.'); }
});
$('#print-brief').addEventListener('click', () => { renderBrief(); window.print(); });
window.addEventListener('beforeprint', renderBrief);
$('#import-answers').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('The answer file is too large.');
    const parsed = JSON.parse(await file.text());
    if (parsed.version !== 1 || parsed.project !== 'iPhones by Shah') throw new Error('Please import an iPhones by Shah answer export (version 1).');
    const clean = validateAnswers(migrateAnswers(parsed.answers));
    const cleanNotes = validateNotes(parsed.notes ?? {});
    answers = { ...answers, ...clean };
    notes = { ...notes, ...cleanNotes };
    save(); renderChapter(); renderBrief(); notify('Answers imported. Matching answers updated; other answers kept.');
  } catch (error) { notify(`Import failed: ${error.message}`); }
  event.target.value = '';
});
$('#reset-answers').addEventListener('click', () => $('#reset-dialog').showModal());
$('#cancel-reset').addEventListener('click', () => $('#reset-dialog').close());
$('#confirm-reset').addEventListener('click', () => { answers = {}; notes = {}; save(); renderChapter(); renderBrief(); $('#reset-dialog').close(); notify('Answers and notes reset. Recommendations are available again.'); });
$('.tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const views = ['vision', 'decisions', 'brief'];
  const index = views.indexOf(currentView);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
  switchView(views[next]); $(`#tab-${views[next]}`).focus();
});
const loadedModels = new Set();
const failedModels = new Set();
function updateModelStatus() {
  if (loadedModels.size === 3) $('#model-status').textContent = 'YOUR MODELS · DRAG TO EXPLORE';
  else if (failedModels.size) $('#model-status').textContent = '3D unavailable for some models · poster shown';
  else $('#model-status').textContent = `${loadedModels.size}/3 models ready…`;
}
$$('model-viewer').forEach(model => {
  model.addEventListener('load', () => { loadedModels.add(model.id); updateModelStatus(); });
  model.addEventListener('error', () => { failedModels.add(model.id); updateModelStatus(); });
});
setTimeout(() => { if (loadedModels.size < 3 && !failedModels.size) $('#model-status').textContent = 'If 3D is unavailable, a static preview is shown'; }, 18000);
renderNav();
renderChapter();
renderStock();
renderAdmin();
if (location.hash === '#decisions' || location.hash === '#brief') switchView(location.hash.slice(1), false);
