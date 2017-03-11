---
layout: post
title: "usergrid架构设计"
categories: arch
---

Usergrid是一个BaaS系统，后端即服务，旨在为移动和Web应用提供后端服务，包括数据/文件存储、账户管理、消息推送、社交媒体整合、审核与举报等流程整合等，实现快速开发App（当然，PC也可以用，然而时代不同了），减少移动APP开发中各个环节的成本，让开发者把主要精力放在应用本身，大大提高效率。  
![baas](http://regulusun.github.io/images/baas.jpeg)

## Relation-Oriented
在usergrid平台上，实体之间都是通过关系联结，实体不能单独存在，也就不能单独进行查询，只能通过相关的关系来查询；
比如，现在我现在在爱逛街下，对文章A发表了一条评论B，那么如果要查询评论B，就必须通过爱逛街下文章A下的评论（`/taobao/aiguangjie/api/v1/articles/articleA/comments/commentB`）这层关系来进行查询，而不是像之前关系型数据库中，那样直接查询实体，如`SELECT * FROM table_comment WHERE app = ? AND artcleid = ?`，再进行where条件的过滤；  

在Usergrid的设计中，所有实体都会与应用建立关系，所以你也可以通过应用下的评论这层关系来查找，不过这样找到的是所有的评论，而不仅仅是文章A下的评论；总之，在Usergrid中，你都需要通过关系带出相应的实体  
 
在usergrid内部，关系分为两种，分别为collection与connection；  
  
  +	**collection**  
  collection，也可以理解为强关系或集合（包含）关系，代表两个实体，**在特定的上下文**，天生就具有一定的关系，比如在极有家日记这个上下文，极有家的日记与评论，天生就具有一对多的关系，一个文章对应多个评论；这种ER模型图中的一对一，一对多，多对多，自反等关系，都称之为collection；collectionName一般是目标实体的类型的复数（InflectionUtils），如Article与Comment之间的collection关系名即为comments；
  + **connection**  
  connection，也可以理解为弱关系，代表本来两个不相关的实体，通过一些互动行为，使两者之间产生了微弱的关系，这种关系称之为connection，比如我赞了文章A，我本来和文章A是没有半毛钱关系的，但我通过互动行为（赞），让我和文章A有了一种关系，我可以通过我喜欢的列表，来找到文章A；  
  	+ **connecting**  
  	这种弱关系，一般分为主动关系与被动关系，在Usergrid中，主动关系仍称之为connection，而被动关系则称之为connecting  
  	举个例子，主动关系“我喜欢了日记A”，`/users/me/favor/diaries/diaryA`，被动关系“日记A被哪些人点赞了”，`/diaries/diaryA/connecting/favor/user`

## High-Level Overview
![ug-high-arch](http://regulusun.github.io/images/ug-high-arch.png)

+ **Access Layer**  
  接入层，囊括了各种接入方式，如RESTful API，HSF，MTOP，当然也将提供iOS/Android等SDK，无线时代，Usergrid一切以无线为优先；  
  HSF/MTOP不提供应用管理，应用管理由RESTful API提供
+ **Service Layer**  
  服务层，主要功能包括服务解析，服务定位，服务处理等，同时也提供了服务扩展的能力，你可以按照Usergrid的约定实现自己的服务，让大家都可以使用你提供的服务；假如现在平台没有文件上下传功能，然后你按照约定提供一个AssertService，大家都可以用你的文件上下传功能了，这样，平台的能力就越来越强大了。
+ **Persistence Layer**  
  持久层，定义了usergrid的核心抽象，实体与关系，主要处理实体与关系的DAO操作，索引创建与检索，对上层暴露实体与关系的核心API，如创建、更新、删除、获取实体，创建和删除关系，搜索实体等等；

## Detailed Architecture
![ug-detail-arch](http://regulusun.github.io/images/ug-detail-arch.png)
### Access Layer

#### RESTful API
RESTful API对关系的描述非常人性，贴近我们的自然语言，比如我喜欢的日记列表，`/users/me/like/diaries`;  
我们采用[Jersey](https://jersey.java.net/)作为我们的[RESTful](http://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm)框架，因其轻量与SubResource Locator；RESTful API提供了HSF API所提供的，另外还提供了管理层面的接口，portal调用这些接口来达到组织、应用、角色、权限、用户等的管理工作，明显地，这些操作不能随便进行，需要相应的授权，比如角色（是否是系统管理员），[OAUTH2](http://oauth.net/2/)，客户端证书等； 
 
此外，除了对基本对象的管理之外，还提供了一些后门，如索引重建，bootstrap（初始化管理应用的应用）等；    
有些Resource，比如上面说的后门，可能需要应用级权限，或组织级权限，或管理员权限，又或系统超级管理员权限，我们定义了与之对应的4个Annotation，然后通过实现`com.sun.jersey.spi.container.ResourceFilter`来实现资源的过滤。  


#### SDKs
我们将提供丰富的sdk，比如iOS，Android，H5/JS，Java，Node.js等等

### Service Layer

#### Security
Usergrid平台的安全功能，引入了开源安全框架[Shiro](http://shiro.apache.org/)，选择它是因为其良好的扩展性与易用性，我们只需要实现自己的Realm，通过持久层来访问Usergrid平台的安全数据；

#### Management
服务层提供了Organization、Application及User的管理服务，如激活用户，创建组织，应用，获取accessToken，获取clientId，创建clientSecret等等，为上层REST层提供管理服务接口，同时也为安全模块提供接口，使得访问持久层更加简单清晰；

#### Services
+ **ServiceParameter**  
我们定义了三种ServiceParameter，IdParameter、NameParameter与QueryParameter，以判别不同的参数类型；服务层会先分析请求，然后把相关的参数添加到parameters中，添加的过程中，会解析参数的类型，UUID会映射成IdParameter，Query会映射成QueryParameter，其余的会映射成NameParameter；
+ **ServicePayload**  
显而易见，ServicePayload是指请求所携带的数据，比如创建一个实体，那么ServicePayload就是实体的数据
+ **ServiceRequest**  
请求被设计成链式的，以实现多层关系的操作（比如我的朋友A的姐姐的爸爸的朋友B的...）；一个请求由服务名（参数列表的第一个参数），ServiceParameter参数列表，ServicePayload数据及所有者owner（第一层的owner为应用）；  
请求执行的时候，第一件事就是要去寻找服务名所对应的Service实例，这块由ServiceManager负责实现，然后执行相应的Service;
+ **ServiceResults**  
请求的执行结果，带有下一次要执行的ServiceRequest，以实现多层关系的操作
+ **ServiceContext**  
服务上下文，包括了服务相关的所有信息，如执行的服务Service，参数列表ServiceParameter，数据ServicePayload，查询Query，请求ServiceRequest，上一层关系的请求结果ServiceResults等
+ **ServiceManager**  
ServiceManager负责根据服务名称，按照一定的规则寻找相应的Service实例；大家可以按照约定，来实现自己的Service，从而来扩展平台的Service能力；
+ **核心Service**
	+ **AbstractService**  
	Service层最核心的类，它先会组装出一个ServiceContext，然后根据上下文的不同，byUUID或ByName或ByQuery，来执行不同的方法，这些方法需要继承类去覆写；  
	流程执行完毕之后，会导出得到的实体，给实体赋予关系计数，边的动态属性、与之关联的所有关系（包括collection、connection及connecting）以及字典元数据等等
	+ **CollectionService**  
	继承自AbstractService，是强关系操作的抽象基类
	+ **ConnectionService**  
	继承自AbstractServcie，是弱关系操作的抽象基类
	

### Persistence Layer
#### 核心抽象
+ **Entity**（com.apache.usergrid.persistence.Entity）  
  Entity接口是实体的抽象，继承EntityRef（实体引用）接口，所有实体都有UUID唯一标识，类型type，名字name，创建及更新时间created/modified，当然最重要的是实体数据，在usergrid中，实体数据用properties表示；所有的实体都存储在实体那一张表上；  
    
  至于实体的唯一标识用UUID的原因很简单，UUID生成比较简单，不需要引入额外的稳定性因素，而且可以基于时间生成，天生支持时间排序；    
  
  + **EntityRef**（com.apache.usergrid.persistence.EntityRef）  
  EntityRef代表一个实体的引用，由UUID与type唯一定义
  + **ExternalEntity**（com.apache.usergrid.persistence.ExternalEntity）  
  当然，在集团内，并不是所有的实体都存储在usergrid中，比如UIC的用户，IC的商品等等，这种我们称之为外部实体，存储于usergrid中的，称之为内部实体；外部实体用属性external标识，外部实体考虑到目前集团内，主键一般为long类型的，故目前只支持long类型的外部实体，外部实体只存储其引用（EntityRef，实体引用，由UUID与Type唯一构成）； 
  + **DynamicEntity**（com.apache.usergrid.persistence.DynamicEntity）   
  usergrid本身预定义了一些实体，位于com.apache.usergrid.persistence.entities包下面，如Application，Role，Group，User等等，并且定义了元数据，详细见Schema；当然你不需要告诉我们你要创建什么类型的实体，有哪些关系，你都可以通过usergrid的portal进行创建，这种实体不是预定义的，没有相关的元数据描述，我们称这样的内部实体为DynamicEntity； 
  + **DynamicProperty**   
  在关系数据库中，有时候我们的对象会有一些扩展属性，有点麻烦，需要额外留一个字段，把一坨东西塞在里面；而在nosql中，我们可以充分利用nosql的特性，可以动态的增加实体的属性，我们把这种没有预定义的实体属性，称之为dynamicProperty动态属性，也就是说实体的properties是由预定义的properties和dynamicProperties组合而成；
  
+ **Edge**（com.apache.usergrid.persistence.graph.Edge）  
  Edge接口是关系的抽象，代指从一个实体（sourceNode）关联到另一个实体（targetNode），关系名称代表这条边的类型（type），关系的创建时间（timestamp）；当然，关系建立的时候，有时候也会有一些动态属性（dynamicProperty），比如收藏时的价格，加购时的价格；  
  既然架构是面向关系的架构，我们在存储关系时，会存储各种关系的冗余数据，简单来讲，所有常用的关系查询，正向或反向（被动），我们都有与之对应的key设计；

---  
#### Schema
+ **EntityProperty**（com.apache.usergrid.persistence.annotations.EntityProperty）  
  EntityProperty注解用来标识实体的属性，标识其名称name，是否是必须的required，是否是唯一的unique等等
+ **EntityCollection**（com.apache.usergrid.persistence.annotations.EntityCollection）  
  EntityCollection注解用来标识一个实体的collection关系，标识关联的collection的类型type，是否是多对多关系linkedCollection（如果是多对多关系，比如User与Group，把一个User加入到一个Group的同时，也会在User的Groups中加入这个Group）
+ **EntityDictionary**（com.apache.usergrid.persistence.annotations.EntityDictionary）  
  EntityDictionary注解用来标识实体的字典数据，字典数据一般以set或map的形式存储，keyType标识键的类型，valueType代表值的类型；

---
#### 核心API
+ **EntityManager**（com.apache.usergrid.persistence.EntityManager）  
  usergrid最最核心的接口，可以理解为通用数据存储检索DAO的接口定义，它既包括了实体的相关操作及关系的操作，而关系的操作是委托给RelationManager来操作的，这样做的好处显而易见，RelationManager可以专职于关系的操作；  
  EntityManager提供了对实体的CRUD操作，也提供了基础对象（Applicatoin，Role，Group等）的一些复合操作，简化了服务层的代码逻辑；另外，还提供了权限、计数相关的操作  
  + **EntityCollectionManager**（com.apache.usergrid.persistence.collection.EntityCollectionManager）  
  EntityCollectionManager专门负责实体的写操作
+ **RelationManager**（com.apache.usergrid.persistence.RelationManager）  
  RelationManager，如上面所述，提供了关系操作的API封装，在写方面，创建关系，删除关系，从集合中移除实体，集合中添加实体这些常见的关系写操作，这些操作都会自动increase/decrease相应的关系计数；  
  在读方面，RelationManager提供了，比如是否有这条关系，关系元数据的查询，获取某个集合下的实体列表，查询集合，查询关动和被动关系下的实体列表等常见的关系读操作
  
---  
#### 多租户（multi-tenancy）
组织/应用是唯一标识租户身份，一个组织下可以申请多个应用；每个应用，在usergrid平台上都有一份虚拟实例，每个租户拥有各自的用户体系，权限等等  
应用代表租户，那么谁来管理租户呢？Usergrid平台会在bootstrap时，创建一个管理应用的应用，这个特殊的应用就是用来管理租户（应用）的   

+ **ApplicationScope**（com.apache.usergrid.persistence.core.scope.ApplicationScope）  
各租户的数据，都是以此为标识，进行逻辑隔离

---
#### 数据检索
数据检索的统一策略是检查Query中有没有查询语句ql，如果有，则走搜索引擎，否则直接查询数据库，这一点对使用方是无感知的；  

+ **Query**（com.apache.usergrid.persistence.Query）  
为了屏蔽不同搜索引擎的语法，我们用[antlr](http://www.antlr.org/)自己定义了一套类SQL的简单查询语法，要支持不同的搜索引擎，只需要实现`com.apache.usergrid.persistence.index.query.tree.QueryVisitor`  

---
#### 索引
按照往常的经验，创建索引时，不同的实体有不同的schema，因此不同的实体就需要创建不同的索引文档，无法进行统一索引，但作为平台，我们无法忍受这一点，我们希望能有一份统一的索引schema，幸好我们发现[Lucene](https://lucene.apache.org/)3.4.0发布了一个特性[Index-time joins](https://lucene.apache.org/core/4_4_0/join/org/apache/lucene/search/join/package-summary.html)正好符合我们的要求，我们把实体作为一个Map进行打平（实体的属性值多少不影响schema），然后与关系join成一个document，然后这个索引文档就可以通过关系进行检索了。  
注：比较尴尬的是，集团内的HA3不支持这个特性，目前我们在考虑自建[Elasticsearch](https://www.elastic.co/)集群  

---
#### 计数
计数主要分为两类，应用计数与关系计数，应用计数主要应对浏览量、点击数这类需求，这类计数被设计成可以按分钟数统计，比如近1分钟，近5分钟，近一天，近一周，近一月等等；而关系计数则是平台的“正统需求”，代表了一个实体到另一个（或一类）实体，有多少条边；  

在新增或删除关系时，都会增加或删除相应实体的关系计数，关系计数分三种，强关系（collection）的关系计数，弱关系的主动（connection）关系计数，弱关系的被动（connecting）关系计数；  
关系计数的获取很简单，只要你获取到了实体，实体的元数据（metadata）中已经包含了所有与之相关的关系  
  
+ **Count**（com.apache.usergrid.count.common.Count）

## 参考资料
1. [Jersey 2.22.2 User Guide](https://jersey.java.net/documentation/latest/index.html)
2. [Jersey 1.19 User Guide](https://jersey.java.net/documentation/1.19/index.html)
2. [Apache Shiro Architecture](http://shiro.apache.org/architecture.html)
3. [Mobile backend as a service](https://en.wikipedia.org/w/index.php?title=Mobile_backend_as_a_service&redirect=no)
4. [ANTLR (ANother Tool for Language Recognition)](http://www.antlr.org/)
5. [Searching relational content with Lucene's BlockJoinQuery](http://blog.mikemccandless.com/2012/01/searching-relational-content-with.html)
6. [Apache Lucene](https://lucene.apache.org/)
7. [Elasticsearch 权威指南](http://www.learnes.net/)
8. [Nested Objects in Solr](http://yonik.com/solr-nested-objects/)
9. [Apache HBase™ 参考指南](http://abloz.com/hbase/book.html)
10. [leancloud](https://leancloud.cn/)

