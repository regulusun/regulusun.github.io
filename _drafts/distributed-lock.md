> 最近项目出现了一个并发问题，导致了大量重复的解冻，虽然支付宝那边有做幂等，但瞬间的量实在有点大，支付宝开发说这比秒杀还猛，我感觉没这么夸张吧。。。大量notify消息，重复率也挺高，因此，我需要一个机制可以控制重复，又可以控制数量；那么，我的问题来了，不是挖掘机哪家强。。。这个分布式锁该如何实现呢？
我自己实现之前我先看了搜索了一遍ATA，发现有一篇文章[tair实现分布式锁](http://www.atatech.org/articles/20715)，这不正是我要找的么，写的也不错，然后就开始“搬”了，只是要增加一个并发数的控制。

分布式并发控制，一般解决这种问题，无非就是把分布式的请求集中到一个地方控制，能做到这个的有很多，如redis，memcached，zookeeper等等，当然在阿里肯定就用tair了。

分布式锁实现我采用了锡爵文章第3种做法，其实还有一种做法更简单一些，后面会讲到；现在要在这个基础上增加并发数控制，这也很简单，tair上再分配一个key，专门用来存储当前并发数，嗅觉灵敏的同学可能已经嗅到了一种常用的设计模式：装饰器模式。对！我们现在就是要在功能上再增加一些额外的功能，这正好符合装饰器模式。

那么我们先来看一下分布式锁的接口DistributedLock：
```java
	/**
     * 尝试获取分布式锁
     * @return 分布式锁获取状态
     */
    LockStatus tryLock(Serializable key);

    /**
     * 释放分布式锁
     */
    void unlock(Serializable key);

    /**
     * 当获取分布式锁失败时，获取被哪台机器哪个线程占用了锁
     */
    String getLockInfo(Serializable key);
```
接口相当简单，和jcp里的lock接口类似，只是多了一个获取分布式锁信息的方法，我用另一种方法没法获取分布式锁信息，所以为了高大上，我果断采用了put的版本。

和锡爵文章还有一点不同的是，tryLock返回的是LockStatus，这是一个枚举，先来看下这个枚举吧：
```java
public static enum LockStatus {
    /**
     * 成功
     */
    SUCCESS,
    /**
     * 并发数控制，重试
     */
    CONCURRENCY_FAILURE,
    /**
     * 分布式锁控制，丢弃（去重）
     */
    DISTRIBUTED_FAILURE,
    /**
     * 异常之后业务继续
     */
    EXCEPTION_CONTINUE,
    /**
     * 异常之后继续重试
     */
    EXCEPTION_FAILURE,
    /**
     * 锁重入
     */
    REENTRANT
}
```
看完大家应该都明白了吧，获取锁的结果可能是成功，成功也可能是重入，失败也可能是异常，也可能是其他原因，这里把获取结果细化，对强化功能是非常有好处的，而我们正要用装饰器模式来装饰基础功能。

说到基础功能，那先来看一看怎么用tair实现吧，基本和锡爵文章一样
```java
public class TairLock implements DistributedLock {

    private static final int LOCK_NAMESPACE = xxxx;
    public static final ResultCode[] STATUS = {ResultCode.SUCCESS, ResultCode.DATANOTEXSITS};
    private @Setter MultiClusterTairManager distributedLockTairManager;
    private @Setter int expireTime;
    private static final ThreadLocal<Boolean> threadLocal = new ThreadLocal<Boolean>();

    @Override
    public LockStatus tryLock(Serializable key) {
        threadLocal.set(false);
        // 并发数超过一定数时，并发GET会产生各种网络通信错误
        // 单机并发数不能超过默认100
        Result<DataEntry> r = distributedLockTairManager.get(LOCK_NAMESPACE, key);
        // 如果tair连接失败或其他原因，那么都返回获取锁成功，让业务正常进行下去
        // 也就是说除返回成功和数据不存在两种情况外，其它都不作锁控制
        if (r == null || !Arrays.asList(STATUS).contains(r.getRc())) {
            return LockStatus.EXCEPTION_CONTINUE;
        }

        if (r.getRc() == ResultCode.DATANOTEXSITS) {
            boolean b = distributedLockTairManager.put(LOCK_NAMESPACE, key, LockInfoHelper.getDistributedLockInfo(), 2, expireTime).isSuccess();
            if (!b) return LockStatus.DISTRIBUTED_FAILURE;
            threadLocal.set(true);
            return LockStatus.SUCCESS;
        }
        else if (r.getValue().getValue().equals(LockInfoHelper.getDistributedLockInfo())) {
            threadLocal.set(true);
            return LockStatus.REENTRANT;
        }
        return LockStatus.DISTRIBUTED_FAILURE;
    }

    @Override
    public void unlock(Serializable key) {
        if (threadLocal.get())
            distributedLockTairManager.invalid(LOCK_NAMESPACE, key);
        threadLocal.remove();
    }

    @Override
    public String getLockInfo(Serializable key) {
        Result<DataEntry> r = distributedLockTairManager.get(LOCK_NAMESPACE, key);
        if (r == null || r.getValue() == null) return "UNKNOW";
        return String.valueOf(r.getValue().getValue());
    }
}
```
这里说明两点：
- 我在单机测试并发时，并发数一高就会报大量连接异常或超时等异常，后来在tair同学的帮助下，才知道单机并发数最高100（默认数）
- 既然提到了第一点，那么我在想，是不是要把tair的操作次数降到最低，所以加了threadLocal来进行判定，我想内存不是问题

另外锁信息是由机器IP加线程ID来记录的
```java
public static class LockInfoHelper {
        public static String getDistributedLockInfo() {
            String hostname = "UNKNOW_HOST";
            try {
                hostname = InetAddress.getLocalHost().getHostName();
            } catch (UnknownHostException e) {
                // do nothing
            }
            return hostname + ":" + Thread.currentThread().getName();
        }
    }
```

接下来我们就要应用装饰器模式来装饰这个基础功能了，这里装饰器类的名称我借鉴了IO下面的FilterXXXStream，定义为FilterLock
```java
public class FilterLock implements DistributedLock {
    protected DistributedLock distributedLock;
    protected FilterLock(DistributedLock distributedLock) {
        this.distributedLock = distributedLock;
    }
    @Override
    public LockStatus tryLock(Serializable key) {
        return distributedLock.tryLock(key);
    }

    @Override
    public void unlock(Serializable key) {
        distributedLock.unlock(key);
    }

    @Override
    public String getLockInfo(Serializable key) {
        return distributedLock.getLockInfo(key);
    }
}
```
那么接下来我们就要装饰我们的基础类了，这里我一开始走了不少弯路，后来才猛然发现tair提供了一个”灭绝人性“的接口，其实这个接口也可以用来实现分布式锁的基础功能，只要把upperBound设成1即可。(当初看到这个接口我就想到了徐锦江的动图”忍不住想赞美你“)
```java
public Result<Integer> incr(int namespace, Serializable key, int value,
			int defaultValue, int expireTime, int lowBound, int upperBound)
```
估计大家一看就明白了，soga，那我也不多讲了，上代码
```java
public class ConcurrencyControlLock extends FilterLock {
    private static final int LOCK_NAMESPACE = xxxxx;
    private static final ThreadLocal<Boolean> threadLocal = new ThreadLocal<Boolean>();
    private @Setter MultiClusterTairManager distributedLockTairManager;
    private @Setter int concurrency;
    private @Setter String ccKey;
    private @Setter int ccKeyExpireTime;
    public ConcurrencyControlLock(DistributedLock distributedLock) {
        super(distributedLock);
    }

    @Override
    public LockStatus tryLock(Serializable key) {
        threadLocal.set(false);
        LockStatus lockStatus = distributedLock.tryLock(key);
        switch (lockStatus) {
            case DISTRIBUTED_FAILURE:
                break;
            case SUCCESS:
            case EXCEPTION_CONTINUE:
            case REENTRANT:
                Result<Integer> incr = distributedLockTairManager.incr(LOCK_NAMESPACE, ccKey, 1, 0, ccKeyExpireTime, 0, concurrency);
                if (!incr.isSuccess()) {
                    if (incr.getRc() == ResultCode.COUNTER_OUT_OF_RANGE)
                        return LockStatus.CONCURRENCY_FAILURE;
                    else
                        return LockStatus.EXCEPTION_CONTINUE;
                }
                threadLocal.set(true);
                break;
        }
        return lockStatus;
    }

    @Override
    public void unlock(Serializable key) {
        distributedLock.unlock(key);
        if (threadLocal.get())
            distributedLockTairManager.decr(LOCK_NAMESPACE, ccKey, 1, 0, ccKeyExpireTime, 0, concurrency);
        threadLocal.remove();
    }
}
```
对了，记得用的时候用try/finally来保证unlock执行。

