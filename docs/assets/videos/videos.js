// Click-to-play YouTube embeds (docs/_includes/video_embed.html). Until a thumbnail is clicked, nothing is loaded
// from YouTube; the click swaps in the player from youtube-nocookie.com (the privacy-enhanced embed domain).
document.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('.video-lite') : null;
  if (!b) return;
  var f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.getAttribute('data-video-id')) + '?autoplay=1&rel=0';
  f.title = b.getAttribute('data-title') || 'YouTube video';
  f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.allowFullscreen = true;
  f.className = 'video-frame';
  b.replaceWith(f);
});
