// Click-to-play YouTube embeds (docs/_includes/video_embed.html). Until a thumbnail is clicked, nothing is loaded
// from YouTube; the click swaps in the player from youtube-nocookie.com (the privacy-enhanced embed domain).
// A link made by _includes/video_seek.html plays the same video on the page from its time (data-t, seconds).
function qbppVideoFrame(id, title, start) {
  var f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0' +
          (start ? '&start=' + start : '');
  f.title = title || 'YouTube video';
  f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.allowFullscreen = true;
  f.className = 'video-frame';
  f.setAttribute('data-video-id', id);
  return f;
}

document.addEventListener('click', function (e) {
  if (!e.target.closest) return;
  var b = e.target.closest('.video-lite');
  if (b) {
    b.replaceWith(qbppVideoFrame(b.getAttribute('data-video-id'), b.getAttribute('data-title'), 0));
    return;
  }
  var a = e.target.closest('.video-seek');
  if (!a) return;
  var id = a.getAttribute('data-video-id');
  var p = document.querySelector('.video-lite[data-video-id="' + id + '"], .video-frame[data-video-id="' + id + '"]');
  if (!p) return;                         // the video is not on this page: the link opens YouTube
  e.preventDefault();
  var f = qbppVideoFrame(id, p.getAttribute('data-title') || p.title, a.getAttribute('data-t'));
  f.setAttribute('data-title', p.getAttribute('data-title') || p.title);
  p.replaceWith(f);
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
