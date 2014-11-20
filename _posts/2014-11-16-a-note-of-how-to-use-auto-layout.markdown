---
layout: post
title:  "A Note Of Auto Layout"
date:   2014-11-16 16:08:21
categories: tech ios
---
There are three sections in the WWDC 2012 describing how to work with Auto Layout ([202 – Introduction to Auto Layout for iOS and OS X][1], [228 – Best Practices for Mastering Auto Layout][2], [232 – Auto Layout by Example][3]) , as described in [this objc.io issue][4].

I take the these notes to remind myself about some of the most useful points that I learned in making the Klook ios app.

## Tips
1. Think of Auto layout declaratively.
2. A auto layout constraint describes a relation between two views: item1.attribute = multiplier * item2.attribute + constant.
3. In a custom view you have full control over the layout of its subviews.
4. Priority = 1000 means required.

## Layout Process
1. First step: *updating constraints*, happens bottom-up. Triggered by calling [view setNeedsUpdateConstraints], override [view updateConstraints] for custom views. This step solves constraints.
2. Second step: *Layout*, happens top-down. Triggered by calling [view setNeedsLayout], [view layoutIfNeeded], override [view layoutSubviews] for custom views. When layoutSubviews get called, we have frames (for subviews?).
3. Third step: *display*, happens top-down. Triggered by calling [view setNeedsDisplay], override [view drawRect:] for custom views.

## Local Constraints
1. Implementing requiresConstraintBasedLayout to return YES.
2. The place to add local constraints is updateConstraints. Make sure to invoke [super updateConstraints] in your implementation after you’ve added whatever constraints you need to lay out the subviews.

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
    * Pause your app then po [[UIWindow keyWindow] \_autolayoutTrace].

## Animation:
* Two strategies:
    * Changing constraints to recalculate frames and use Core Animation to interpolate between the old and the new postion. Violates constraints temporarily. Can animate removing/adding constraints.
    * Directly animating the constraints themselves. Very slow. Only animate constant.
* [view layoutIfNeeded]
* Don't set frames yourself.

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
