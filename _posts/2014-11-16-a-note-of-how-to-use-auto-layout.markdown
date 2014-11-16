---
layout: post
title:  "A Note Of Auto Layout"
date:   2014-11-16 16:08:21
categories: tech ios
---
There are three sections in the WWDC 2012 describing how to work with Auto Layout ([202 – Introduction to Auto Layout for iOS and OS X][1], [228 – Best Practices for Mastering Auto Layout][2], [232 – Auto Layout by Example][3]) , as described in [this objc.io issue][4].

I take the these notes to remind myself about some of the most useful points that I learned in making the Klook ios app.

## Tips
1. Think of Auto Layout declaratively

## Debugging
Auto Layout can have two kinds of problem, ambiguous constraints and unsatisfiable constraints.

* Ambiguous Constraints:
    * will be tolerated
    * means we need more constraints;
    * can write a method to loop through views using:
        * [view hasAmbiguousLayout]
        * [view exerciseAmbiguityInLayout]
        * [window visualizeConstraints:]

* Unsatisfiable Constraints:
    * will be reported
    * read logs: 
        * check if translatesAutoresizingMaskIntoConstraints is set to NO; 
        * name views in storyboard using identifier. 
    * [view constraintsAffectingLayoutForAxis:]

## Animation:
* [view layoutIfNeeded]

## Custom UIView:
* override the following UIView methods:
    * intrinsicContentSize:
    * alignmentRectForFrame: 
    * frameForAlignmentRect: 
    * alignmentRectInsets:
    * baselineOffsetFromBottom

[1]: https://developer.apple.com/videos/wwdc/2012/?id=202
[2]: https://developer.apple.com/videos/wwdc/2012/?id=228
[3]: https://developer.apple.com/videos/wwdc/2012/?id=232
[4]: http://www.objc.io/issue-3/advanced-auto-layout-toolbox.html
