# BHN-Mobile
Mobile site for Bright House Networks. This will be used to build from a mobile first approach and progressively enhance.


How to add custom css to framework:
-----------------------------------

1. Create custom.less file

2. Use custom.less as a partial

3. Add import to bootstrap.less at very bottom of the code.
	 <code>@import “custom.less”;</code>

4. Use grunt on command line to compile into bootstrap.min.css
	 <code>grunt watch</code>	
	 


*** I am using Owl Carousel ***
-------------------------------

http://owlgraphic.com/owlcarousel/
This is a touch enabled cross browser friendly image carousel

- Core files are added to bootstrap.css via an @import in bootstrap.less at less/bootstrap.less

- The less partial is owl-carousel.less at less/owl-carousel.less

- Custom control css is located in custom.less at less/custom.less

- Custom control JS is located in custom.js at dist/js/custom.js