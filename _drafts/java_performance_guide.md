---
layout: post
title: "观测高压力下java系统的简易指南"
categories: java
---

# 应有的准备
有没有一些演练？
监控，日志，，，，有了这些才能有效的观测系统
强弱依赖
作战手册！！！
接入鹰眼 接入xflush 接入alimontor 接入sentinel  接入switchcenter

LMbench 
JDK版本 jdk7_u60以下存在一定的并发量的情况下 ssl 会存在死锁

# 系统
系统连接数，句柄数
[用十条命令在一分钟内检查Linux服务器性能](http://techblog.netflix.com/2015/11/linux-performance-analysis-in-60s.html)
## 内核
## 虚拟机知识

# WEB服务器
# 机房、单元化
## 虚拟机与宿主机
for i in $(armory -g translate |grep vmparent |awk '{print $NF}');do echo ==========;armory -p $i -le;done

# LOAD
LOAD代表了什么？
LOAD单核1为满载，超过1会怎么样？
影响LOAD的有哪些因素呢？
# CPU
查看最耗CPU的线程  top -H -p pid
CPU0
查看各个CPU使用情况 top后按1
# THREAD
最佳线程数的估算
jstack pid
看线程状态 + 线程数量 + 哪种线程数比较多（热点线程）
查看线程切换开销 vmstat 1 看cs选项 一般情况下, 空闲系统的上下文切换每秒大概在1500以下. 
一些常见的线程：
# MEMORY
业务上最近有没有大的变动，会导致内存量剧增之类的
面向GC的JAVA编程
jmap -dump:format=b,file=/home/admin/logs/jmap.bin  pid   -》 zprofiler
增加-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=“ 来自动生成DUMP文件
/home/admin/logs/gc.log cms gc的六个阶段
## 字符串
首先应对JVM有比较深入的了解
jstat -gcutil pid time_interval
# DISK IO
top 查看swap分区的使用情况（swap分区监控）
# NETWORK
## 网卡网络流量
http://www.ibm.com/developerworks/cn/aix/library/1203_weixy_ivenetwork/
首先，通过tsar --traffic -l 命令查看网络流量
千兆网络单向流量理论的极限值为 125MB/s, 单向包的数量极限大约为 11 万个，收发一致；万兆网络单向流量理论值为 1250MB/s, 单向包的数量极限值大约为 50 万个，收发一致。
## 带宽
iperf  http://ixdba.blog.51cto.com/2895551/1563110
## TCP包
如果有提示网络延时，连接异常等情况时，
用tsar --tcp 1 -l 观察下TCP包重传率 retran/outseg
## MTU
## CDN
## DNS

# 监控
alimonitor
eagleeye
看是否被限流了，如果QPS-错误数在某个值附近，就有可能是被限流了
流量不均，看**各个接口**的单元化配置、负载均衡策略等等
# 日志
