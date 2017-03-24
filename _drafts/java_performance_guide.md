---
layout: post
title: "观测高压力下java系统的简易指南"
categories: java
---

## 准备工作
### 中间件原理与集群部署方式、路由
为什么需要知道中间件的原理与部署方式，这和观测系统有什么关系？  
总的来讲，观测一个系统并不是轻松的事，需要知道系统的各种依赖，而你的系统少不了和中间件打交道，所以
理解中间件的原理和部署方式就很有必要了。
  
### 虚拟机知识
### 机房、单元化

### 字符串
首先应对JVM有比较深入的了解
`jstat -gcutil pid time_interval`  

### 吞吐量与Latency
[throughtput与latency](http://coolshell.cn/articles/7490.html) 


有没有一些演练？
监控，日志，，，，有了这些才能有效的观测系统
强弱依赖
作战手册！！！
接入鹰眼 接入xflush 接入alimontor 接入sentinel  接入switchcenter

LMbench 
JDK版本 jdk7_u60以下存在一定的并发量的情况下 ssl 会存在死锁

## 单机观测
### 系统
系统连接数，句柄数
[用十条命令在一分钟内检查Linux服务器性能](http://techblog.netflix.com/2015/11/linux-performance-analysis-in-60s.html)
### 内核
### 连接数
文件句柄数  lsof
线程池
数据库连接数

### WEB服务器

### 虚拟机与宿主机
`for i in $(armory -g translate |grep vmparent |awk '{print $NF}');do echo ==========;armory -p $i -le;done`

### LOAD
LOAD代表了什么？
LOAD单核1为满载，超过1会怎么样？
影响LOAD的有哪些因素呢？ 

+ 首先，看下QPS有没有超出单机阈值
+ 如果load高，看下CPU高不高
+ 如果load高，抓下线程dump，看有没有热点线程wait或block
+ 当然内存也会影响LOAD，频繁YGC也一定程序上会影响


### CPU
+ 查看最耗CPU的线程  `top -H -p pid`，然后把进程号转换成16进制，看看线程堆栈中对应哪个线程
+ CPU0的作用
+ 查看各个CPU使用情况 top后按1
+ CPU很高，看下LOAD高不高，先dump下线程，看有没有热点线程
+ hot method分析：`jcmd $pid AgentLib.load name=zprofileragent`


### THREAD
+ 最佳线程数的估算
+ jstack pid 看线程状态 + 线程数量 + 哪种线程数比较多（热点线程）
+ 查看线程切换开销` vmstat 1` 看cs选项 一般情况下, 空闲系统的上下文切换每秒大概在1500以下. 
+ 一些常见的线程：


### MEMORY
+ 业务上最近有没有大的变动，会导致内存量剧增之类的
+ 面向GC的JAVA编程
+ `jmap -dump:format=b,file=/home/admin/logs/jmap.bin  pid`   -> zprofiler
+ gcore   core dump  
  `sudo gdb -q --pid　//启动gdb命令`  
  `(gdb) generate-core-file //这里调用命令生成gcore的dump文件` 
  `(gdb) gcore /tmp/jvm.core　//dump出core文件`   
  `(gdb) detach //detach是用来断开与jvm的连接的`    
  `(gdb) quit //退出`    
  `jmap -dump:format=b,file=heap.hprof /opt/taobao/java/bin /tmp/jvm.core`  
+ gdb java -p xxxx;set &HeapDumpBeforeFullGC = 1;
+ 增加-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=“ 来自动生成DUMP文件
+ /home/admin/logs/gc.log cms gc的六个阶段
+ 用`jstat -gcutil`看看各个区的变化
+ 看下GC的时间是否比较长，比如超过0.1sec
+ 看看有没有FGC，YGC，是否频繁，GC日志里有没有出现GC之后仍旧存活大量对象的情况等等
+ `dmesg |grep -E 'kill|oom|out of memory'`  查看是否有内存溢出


### DISK IO
+ top 查看swap分区的使用情况（swap分区监控）
+ ssd有读写通道共享的问题，当写入很高时会阻塞读请求
[磁盘写导致IO wait飙升的问题深入排查](http://www.atatech.org/articles/53765/?frm=mail_daily&uid=75711)

### NETWORK
#### 网卡网络流量
http://www.ibm.com/developerworks/cn/aix/library/1203_weixy_ivenetwork/  
首先，通过`tsar --traffic -l `命令查看网络流量  
千兆网络单向流量理论的极限值为 125MB/s, 单向包的数量极限大约为 11 万个，收发一致；万兆网络单向流量理论值为 1250MB/s, 单向包的数量极限值大约为 50 万个，收发一致。
#### 带宽
iperf  http://ixdba.blog.51cto.com/2895551/1563110
#### TCP包
如果有提示网络延时，连接异常等情况时，
用`tsar --tcp 1 -l `观察下TCP包重传率 retran/outseg
#### MTU
#### CDN
#### DNS

### 监控
alimonitor
eagleeye
看是否被限流了，如果QPS-错误数在某个值附近，就有可能是被限流了
流量不均，看**各个接口**的单元化配置、负载均衡策略等等
### 日志

## 整体观测

[Tair开发手册](http://www.atatech.org/articles/4743)