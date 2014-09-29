---
layout: post
title:  "Git Flow Keypoints"
date:   2014-05-08 21:08:21
categories: tech git
---

###A successful git flow
![Git flow image]({{ site.url }}/images/git-flow.png)

###Main branches:
_Master and developer is what we always keep on gitlab._

####master

1. Head should always reflects a production-ready state.
2. Every commit is a new release by definition.
3. Commits must be tagged for easy future reference.
4. Could use git hook script to automatically build and roll-out to production server when commit on master happnes.  

####develop
1. Always reflects a state with the latest delivered development changes for the next release. (where nightly builds happen)
2. When reaches a steady point, merge it into master (by a release branch).

###Supporting branches
_Should follow strict rules to merge from/into._

####Feature branches

From: develop

Into: develop

Naming: anything except master, develop, release-x, or hotfix-x

1. Will be merged back into develop or discarded.
2. Feature branches typically exist in developer repos only, not in origin (not in allinns case).
3. Example: Weixin/manage feature in our case.
4. Remember to use --no-ff to create merge message.

_usage_

{% highlight bash %}
$ git checkout develop
$ git merge --no-ff myfeature
$ git branch -d myfeature
$ git push origin develop
{% endhighlight %}

`--no-ff`
no fast-forwarding. Create a merge commit even when the merge resolves as a fast-forward. This is the default behaviour when merging an annotated (and possibly signed) tag.

####Release branches
From: develop

Into: develop and master

Naming: release-x

1. Preparation of a new production release.
2. Branch a release when develop reflects the desired state fo the new release.
3. Allow last minute bug fixes, preparing meta-data(version number, build dates).
4. Large new features strictly prohibited.
5. At this moment assign a versioin number.

_Creating_

{% highlight bash %}
$ git checkout -b release-1.2 develop
$ ./bump-version.sh 1.2
$ git commit -a -m "Bumped version number to 1.2"
{% endhighlight %}

_release branch to master branch_

{% highlight bash %}
t checkout master
$ git merge --no-ff release-1.2
$ ./bump-version.sh 1.2
$ git tag -a 1.2
{% endhighlight %}

_release branch to develop branch_

{% highlight bash %}
$ git checkout develop
$ git merge --no-ff release-1.2
{% endhighlight %}

_remove release branch_

{% highlight bash %}
$ git branch -d release-1.2
{% endhighlight %}

####Hotfix branches

From: master

Into: develop and master

Naming: hotfix-x

1. Like release branch but unplanned.
2. The essence is that work of team members (on the develop branch) can continue, while another person is preparing a quick production fix.
3. If a release branch currently exists, merge into release branch instead of develop.

_branching_

{% highlight bash %}
$ git checkout -b hotfix-1.2.1 master
$ ./bump-version.sh 1.2
$ git commit -a -m "Bumped version number to 1.2.1"
$ git commit -m "Fixed severe production problem"
{% endhighlight %}

_finishing_

{% highlight bash %}
$ git checkout master
$ git merge --no-ff hotfix-1.2.1
$ git tag -a 1.2.1
$ git checkout develop
$ git merge --no-ff hotfix-1.2.1
$ git branch -d hotfix-1.2.1
{% endhighlight %}

###Reference
[A successful Git branching model](http://nvie.com/posts/a-successful-git-branching-model/)
