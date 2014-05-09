---
layout: post
title:  "Allinns git flow"
date:   2014-05-08 21:08:21
categories: git
---

###Git Flow Cheatsheet

####A successful git flow
![Git flow image]({{ site.url }}/assets/git-flow.png)

####Main branches:

#####master
1. Head should always reflects a production-ready state.
2. Every commit on master is a new release by definition.
3. Commit on master must be tagged for easy future reference.
#####develop
1. Always reflects a state with the latest delivered development changes for the next release. (where nightly builds happen)
2. When develop reach a steady point, merge it into master and tagged with a release number. (through a release branch)

####Supporting branches

*Should follow strict rules to merge from/into.*

#####Feature branches
Branch off from: develop
Merge back into: develop
Naming convention: anything except master, develop, release-*, or
hotfix-*

1. Weixin/manage feature in our case.
2. Will eventually be merged back into develop or discarded.
3. Feature branches typically exist in developer repos only, not in origin.

git merge --no-ff myfeature 
(avoid losing information about historical
existence of a feature branch and groups together all commits that together
added the feature.)

#####Release branches
May branch off from: develop
Must merge back into: develop and master
Branch naming convention: release-

Release branches support preparation of a new production release.
allow last minute bug fixes, preparing meta-data(version number, build dates).

branch a release when develop reflects the desired state fo the new release.
At this moment assign a versioin number.

git checkout -b release-1.2 develop

allow: small bug fixes, large new features strictly prohibited.

#####release branch to master branch:
t checkout master
$ git merge --no-ff release-1.2
$ ./bump-version.sh 1.2
$ git tag -a 1.2
#####release branch to develop branch:
$ git checkout develop
$ git merge --no-ff release-1.2
#####remove release branch
$ git branch -d release-1.2

#####Hotfix branches
May branch off from: master
Must merge back into: develop and master
Branch naming convention: hotfix-


Like release branch but unplanned.
The essence is that work of team members (on the develop branch) can continue, while another person is preparing a quick production fix.
#####branching
$ git checkout -b hotfix-1.2.1 master
$ ./bump-version.sh 1.2
$ git commit -a -m "Bumped version number to 1.2.1"
$ git commit -m "Fixed severe production problem"

#####finishing
$ git checkout master
$ git merge --no-ff hotfix-1.2.1
$ git tag -a 1.2.1
$ git checkout develop
$ git merge --no-ff hotfix-1.2.1
$ git branch -d hotfix-1.2.1

#####extra
when a release branch currently exists, the hotfix changes need to be merged
into that release branch, instead of develop.


###Our git flow

###Reference
[A successful Git branching model](http://nvie.com/posts/a-successful-git-branching-model/)
