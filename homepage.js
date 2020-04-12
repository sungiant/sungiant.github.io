// Google Analytics
// ---------------------------------------------------------------------------//

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

'use strict'

// Disable scrolling
// https://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
// ---------------------------------------------------------------------------//
// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; } 
  }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

// call this to Disable
function disableScroll() {
  window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
  window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

// call this to Enable
function enableScroll() {
  window.removeEventListener('DOMMouseScroll', preventDefault, false);
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
  window.removeEventListener('touchmove', preventDefault, wheelOpt);
  window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}


// String Extensions
// ---------------------------------------------------------------------------//
String.prototype.startsWith = function (str) {
  return (this.match("^" + str) == str)
}

String.prototype.endsWith = function (str) {
  var temp = this;
  if (this.length > str.length) {
    var temp = this.substr(this.length - str.length, str.length);
    if (temp == str)
      return true;
  }
  return false;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Utility Functions
// ---------------------------------------------------------------------------//

function getFileContent (src) {
  var content = null;
  $.ajax({
    url: src,
    crossDomain: true,
    success: function (data) {
      content = data;
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // http://stackoverflow.com/questions/7457044/jquery-ajax-unexpected-token-parsererror
      if (jqXHR.status == 200)
        content = jqXHR.responseText;
      else
        return null;
    },
    async: false
  });

  return content;
}


// Knockout & Sammy
// ---------------------------------------------------------------------------//
function HomepageVM () {
  var self = this;


  self.vm_is_loading = ko.observable (true);
  self.vm_current_page = ko.observable ();
  self.vm_current_page_data = ko.observable ();

  self.vm_current_view_image = ko.observable ();

  // all the content
  self.vm_data = ko.observable ();

  // content used in head seems to need own observable
  self.vm_title = ko.observable ();
  self.vm_description = ko.observable ();
  self.vm_author = ko.observable ();


  self.vm_banner = ko.computed (function () {

    if (self.vm_is_loading()) return null;

    var current_page_key = self.vm_current_page();

    var data = self.vm_data();

    var current_demo = _.find (data.demos, function (x) { return x.key === current_page_key; });
    var current_game = _.find (data.games, function (x) { return x.key === current_page_key; });

    if ((current_demo != null && current_demo.banner) || current_game != null)
      return current_page_key;
    
    return data.banner;

  }, this);

  self.vm_is_demo_key = function (zKey) { return _.contains (_.map (self.vm_data().demos, function (x) { return x.key; }), zKey); };
  self.vm_is_game_key = function (zKey) { return _.contains (_.map (self.vm_data().games, function (x) { return x.key; }), zKey); };

  self.vm_get_demo = function (zKey) { return _.find (self.vm_data().demos, function (x) { return zKey == x.key; }); };

  self.vm_left_fill_num = function (num, targetLength) { return num.toString().padStart(targetLength, 0); }

  self.vm_pretty_print = function () { $.getScript ('https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js') };

  self.vm_max_container_width = 960;
  self.vm_image_column_count = 3;
  self.vm_image_gallery_padding = 10;
  self.vm_image_gallery_column_width = (self.vm_max_container_width / self.vm_image_column_count) - ((self.vm_image_gallery_padding * (self.vm_image_column_count - 1)) / self.vm_image_column_count);

  self.vm_update_gamepage = function () {
    $('.grid').masonry({
      columnWidth: self.vm_image_gallery_column_width,
      itemSelector: '.grid-item',
      gutter: self.vm_image_gallery_padding
    });

    $('.main-carousel').flickity({
      cellAlign: 'center',
      wrapAround: true,
      freeScroll: true
    });

  }

  showdown.extension('prettify', function () {
    return [{
      type:   'output',
      filter: function (source) {
        return source.replace(/(<pre[^>]*>)?[\n\s]?<code([^>]*)>/gi, function (match, pre, codeClass) {
          if (pre) {
            return '<pre class="prettyprint"><code' + codeClass + '>';
          } else {
            return ' <code class="prettyprint">';
          }
        });
      }
    }];
  });

  showdown.extension('path_fixer', function () {
    return [{
      type:   'output',
      filter: function (source) {
        var curent_page_key = self.vm_current_page();
        
        if (curent_page_key == null)
          return source;

        var demo_link = _.find (self.vm_data().demos, function (x) { return x.key == curent_page_key; }).link;

        var updated = source
          .replaceAll('<img src="/', '<img src="https://raw.githubusercontent.com/' + demo_link + '/master/')
          .replaceAll('<a href="/', '<a href="https://raw.githubusercontent.com/' + demo_link + '/master/');

        return updated;
      }
    }];
  });

  self.m_converter = new showdown.Converter({extensions: ['prettify', 'path_fixer']});
  self.m_converter.setFlavor('github');

  self.m_sammy = Sammy (function () {

    this.get ('#!/', function () {
      console.log ('Routing: #!/');
      self.vm_current_page (null);
      self.vm_current_page_data (null);
    });

    this.get ('#!/:zPageID', function () {
      var page_key = this.params['zPageID']
      console.log ('Routing: #!/' + page_key);
      $(window).scrollTop(0);
      self.vm_current_page_data (null);
      if (self.vm_is_game_key (page_key)) {
         var game_data = _.find (self.vm_data().games, function (x) { return x.key == page_key; });
         self.vm_current_page_data (game_data);
         self.vm_current_page (page_key);
         console.log ("Current page data: " + page_key);
      }
      else if (self.vm_is_demo_key (page_key)) {
        var demo_data = _.find (self.vm_data().demos, function (x) { return x.key == page_key; });
        var md_file = 'https://raw.githubusercontent.com/' + demo_data.link + '/master/README.md';
        var md = getFileContent (md_file);
        self.vm_current_page (page_key);
        if (md === undefined) {
          console.error ('Failed load page markdown file: ' + md_file)
        }
        else {
          var mdx = md.replaceAll('\\$/', '/pages/' + page_key + '/');
          var lines = S(mdx).lines();
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("[!["); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("## License"); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("This software is"); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("Unless required by"); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("distributed under"); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("See the License"); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("WITHOUT WARRANTIES"); });
          lines = _.filter (lines, function (x) { return ! S(x).startsWith ("limitations under"); });
          mdx = lines.join('\n');
          var html = self.m_converter.makeHtml(mdx);
          self.vm_current_page_data (html);
        }        
      }
    });

    this.notFound = function (){
      console.log ('Routing: #!/');
      location.hash = '#';
      self.vm_current_page (null);
      self.vm_current_page_data (null);
    };

  });

  self.init = function () {

    console.log ('Resolving configuration data.');
    $.getJSON ('/config.json', {}, function (data) {
      console.log ('Configuration data resolved.');

      console.log ('Building data model.');

      // filter out disabled content
      data.demos = _.filter(data.demos, function(x){ return x.enabled; });
      data.projects = _.filter(data.projects, function(x){ return x.enabled; });
      data.games = _.filter(data.games, function(x){ return x.enabled; });
      data.social = _.filter(data.social, function(x){ return x.enabled; });

      // copy all data into knockout vm
      self.vm_data (data);

      // duplicates for html head
      self.vm_title (data.title);
      self.vm_description (data.description);
      self.vm_author (data.author);

      console.log ('Registering GA.');
      ga ('create', data.google_analytics.tracking_key, 'auto');
      ga ('send', 'pageview');

      console.log ('Initilizing routing.');
      self.m_sammy.run ();

      console.log ('Configure input.');
      $(document).on( 
        'keydown', function(event) { 
          if (event.key == "Escape") { 
            self.vm_current_view_image (null);
            enableScroll();
          } 
      });

      console.log ('Ready to go!');
      self.vm_is_loading (false);

    });
  };
}


// Boot
// ---------------------------------------------------------------------------//

$.when(
  $.getScript ('/contrib/js/knockout-3.5.1.min.js'),                          // Model-View-ViewModel pattern with templates.
  $.getScript ('/contrib/js/underscore-1.9.1.min.js'),                        // Functional programming.
  $.getScript ('/contrib/js/sammy-0.7.6.min.js'),                             // Routing.
  $.getScript ('/contrib/js/showdown-1.9.1.min.js'),                          // Markdown to HTML conversion.
  $.getScript ('/contrib/js/stringjs-3.3.3.min.js'),                          // String utils.
  $.getScript ('/contrib/js/masonry-4.2.2.min.js'),                           // Image grid component library.
  $.getScript ('/contrib/js/flickity-2.2.1.min.js'),                          // Carousel component library.
  $.Deferred (function (deferred){ $(deferred.resolve); })
).done (function () {
    var homepageVM = new HomepageVM ();
    ko.applyBindings (homepageVM, document.getElementById ('homepage'));
    homepageVM.init ();
});
