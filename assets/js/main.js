// This js file is designed to be included in all pages

$(function() {
  auto_active_menu();
});

function auto_active_menu() {
  var url = window.location.href;
  // Work for relative and absolute hrefs
  $('.menu a').filter(function() {
      return this.href == url;
      }).addClass('active');
}
