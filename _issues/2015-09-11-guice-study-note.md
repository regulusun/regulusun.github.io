---
layout: post
title: "Guice学习笔记"
categories: ioc
---
## 依赖注入
  依赖注入，控制反转，相信这些概念大家都比较清楚了，举一个不是很对的说法，就是不要自己new，把控制权交给框架，让框架帮你完成对象的创建，这样你的类里就不会引入某些接口的实现类了；如果对这些概念还不是太清楚，请传送到[这里](http://martinfowler.com/articles/injection.html)。
### 设计理念
![guice](http://regulusun.github.io/images/guice.png)  

+ injector是容器，injector包含多个binding，binding是在创建injector时，由module的configure方法配置
+ 每个binding由key、scope、provider组成，其中scope是可选的，默认为单件singleton
+ key唯一标识binding，injector可以通过key找到binding；key包含类型与注解，注解是可选的，比如一个类有多个实现时，为了让binding唯一，必须再指定注解以示区别
+ provider类似工厂，用于生成实例
+ 业务代码可以通过指定key在injector中获取相应的实例（由provider生成）

### 不可逃避的话题 spring vs guice
+ 先来看看bob大牛是怎么想的吧，为什么要重复造轮子[传送门](http://blog.crazybob.org/2007/10/guice-interview-on-tss.html)
+ guice侵入性非常强，有人甚至认为”简直是侵略啊“；而spring是无侵入的
+ guice的module，有人说等同于spring分文件的形式，的确是这样，但guice的module还能让我们以module-orientation的方式编程，我之所以喜欢guice，就是因为它的module
+ spring可以使用xml配置，我也一向认为依赖注入配置就应该是*集中式*的，不过guice也提供了一种*相对集中*的通过编程的配置方式，这也让动态注入成为了可能
+ spring基于name识别，重名时会覆盖或报找不到bean定义[传送门](http://www.javacodegeeks.com/2012/06/spring-vs-guice-one-critical-difference.html)
+ 当然，guice也是可以集成spring的，通过guice的provider，将spring的BeanFactory委托给guice；
+ [更多](http://blog.csdn.net/derekjiang/article/details/7213829)

## Guice Module
  guice的module，上面也说了，类似spring的分文件形式，Module接口只定义了一个configure方法    
  
```java
/**
* Contributes bindings and other configurations for this module to {@code binder}.
* <p/>
* <p><strong>Do not invoke this method directly</strong> to install submodules. Instead use
* {@link Binder#install(Module)}, which ensures that {@link Provides provider methods} are
* discovered.
*/
void configure(Binder binder);
```  

  在其中可以定义一些绑定（binding）关系，比如bind(interface).to(implementation)，这种方式就绑定了接口与其实现，也就意味着在这个模块中通过@Inject标注的interface，最终都会以implementation注入。  
  如果仅仅就这样，的确与spring分文件的形式没多少差别，那么它是否还有其他优点或优势呢？在我看来，优点是明显的，相对于spring分文件的形式，guice的module在抽象层面更进一层，它把spring的分文件形式抽象为一个个模块，模块可以被重用，也可以被继承或覆写，模块可以有子模块，这赋予了更灵活的编程方式与架构模式。

### Reuse
  模块的重用，其实就是一组类的重用，模块重用很简单，从下面Guice类中的这个方法的声明部分就可以看出来，模块在guice中是怎么重用的  
  
```java
/**
* Creates an injector for the given set of modules.
*
* @throws CreationException if one or more errors occur during Injector
*                           creation
*/
public static Injector createInjector(Iterable<? extends Module> modules);
```   

  比如有一个基础配置类Settings，其binding在模块SettingsModule中，那么其它模块如果要读取配置，就会在createInjector时把SettingsModule  
  添加进去，以注入Settings。由此可见，像SettingsModule这种基础模块会在系统中大量地重用，更进一步，你可以利用这些基础模块构建出一个面向模块化开发的基础框架。

### Override
  模块的覆写，应该也是比较常见的场景，比如我有一个模块提供了一些功能，现在有个业务需要该模块的大部分功能，只覆写其中一个或几个功能，  
  这时候我们就可以利用Guice提供的工具类Modules下面的这个方法来实现覆写 
  
```java
/**
 * Returns a builder that creates a module that overlays override modules over the given
 * modules. If a key is bound in both sets of modules, only the binding from the override modules
 * is kept. This can be used to replace the bindings of a production module with test bindings:
 * <pre>
 * Module functionalTestModule
 *     = Modules.override(new ProductionModule()).with(new TestModule());
 * </pre>
 * <p/>
 * <p>Prefer to write smaller modules that can be reused and tested without overrides.
 *
 * @param modules the modules whose bindings are open to be overridden
 */
Modules.override(Iterable<? extends Module> modules).with(Iterable<? extends Module> overrides)
```  

 当然，用测试模块覆写一部分生产模块的功能，在测试工程中是很常见的，这样有利于测试用例的编写。

### Extensibility
  当你实现了某个功能扩展点之后，比如你为系统新增加了一种脚本（clojure）支持，那要通过怎样的方式才能让系统拥有新脚本的能力呢？  
  Guice本身不支持，但Guice本身提供了一种可扩展的机制（SPI），由此衍生出了众多优秀的扩展，其中有一个扩展叫*multibindings*，  
  这个扩展提供了两种方式*MultiBinder*和*MapBinder*，来支持模块功能扩展点的扩展。

## Guice SPI设计
  Gucie提供SPI，主要是用来开发工具、扩展或插件的。Guice提供了以下几个核心抽象，理解这些抽象非常重要  
  
    抽象 | 说明
  :--|:--  
  Key | Key由类型Type和可选的绑定注解（binding annotation）来定义，唯一标识一个绑定binding 
  InjectionPoint | 注入点，由一个Member（可以是构造器、字段或方法）与一组Dependency来定义
  Dependency | 一个注入点可能对应多个Dependency，一个Dependency由一个关联到注入点的Key来定义  
  Element | 配置单元，可被访问，详见`public interface ElementVisitor<V>` 
  Module | 由一组Elements构成，你可以从模块中抽取出Elements（`Elements#getElements(com.google.inject.Module[])`），然后重写这些Elements来构成新的Module 
  Injector | 管理应用的对象图，由一组Modules构成，可以从中获得所有Binding及依赖图（dependency graph）

## Featrues & Extentions
  待续
  
## Guice AOP 
  待续

## 资料
+ [Java on Guice:Guice 1.0 User's Guide](http://malsup.com/jquery/media/guice.pdf)
+ [Google Guice Wiki](https://github.com/google/guice/wiki/GettingStarted)
+ [通过 Guice 进行依赖项注入](http://www.ibm.com/developerworks/cn/java/j-guice.html)
