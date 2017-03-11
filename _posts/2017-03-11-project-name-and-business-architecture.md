---
layout: post
title: "从项目命名看业务架构发展"
categories: thinking
---

### 从项目命名看业务架构发展

最近发现一件比较有趣的事，（业务）项目命名。从项目命名上，我们可以看出业务架构在发展，我们也可以预测未来的项目会怎么命名。

#### 系统
![system](http://regulusun.github.io/images/system.png)

> 系统是相互联系相互作用的诸元素的综合体


这个阶段业务架构比较简单，项目命名上往往以“系统”结尾，对应的系统也往往只有一个，比如“房地产税收系统”，“呼叫系统”，“结算系统”，“银行交易系统”等等，把所有的业务功能都往一个系统上堆

####  中心
![center](http://regulusun.github.io/images/guice.png)

随着业务功能越来越多，越来越复杂，功能耦合也越来越多，业务架构上开始进入SOA阶段，把一个大的业务项目拆分成N个小的业务项目，这些小的业务项目往往以“中心”结尾，对应的系统名往往以center结尾

#### 平台
![platform](http://regulusun.github.io/images/platform2.png)

![platform2](http://regulusun.github.io/images/platform.png)

随着业务发展越来越快，一个系统往往要承载N个业务方的需求，为了支持业务快速发展，业务架构上需要调整，对业务进行产品化，这个阶段的项目命名一般以“平台”结尾，对应的系统名往往以platform结尾  

平台很高大上，这个阶段很多系统都是以platform结尾的，所以有了以下场景：  
A：你们的系统现在实现了平台化了么？   
B：我们的系统名字叫**platform，你说我们实现了没有？  
A：...

A：你们的系统现在实现了平台化了么？     
C：还没有，我们准备把系统名字重构一下 ，改成**platform  
A：...

#### 中台
![middle-office](http://regulusun.github.io/images/middle-office.png)

2015年底公司提出了中台战略，目的是通过重构梳理来提升研发效率，推动业务快速试错快速发展，所以去年出现了很多以“中台”结尾的业务项目，比如电商中台，数据中台等等。

#### 智慧**中台
![ai](http://regulusun.github.io/images/ai.png)

2016年是人工智能元年，各种机器学习，深度学习，当然少不了名星“AlphaGo”，AI是个好东西，对业务也非常有价值，所以从2017年开始，我们的大业务项目都会以“智慧”开头，“中台”结尾，这个阶段可能会持续很久，关键要取决于人工智能的研究进度。

#### So, what's the next?
![whatsthenext](http://regulusun.github.io/images/whatsnext.png)

未来的业务架构到底会是什么样的呢？未来是不是没有业务架构这一说了？大家一起来讨论一下吧
