---
layout: post
title: "Understand NIO"
categories: reading note
---
# 基础概念
## 缓冲区操作
缓冲区及操作是所有I/O的基础，进程执行I/O操作，归结起来就是向操作系统发出请求，让它要么把缓冲区里的数据排干（写），要么把缓冲区填满（读）。如下图  
![缓冲区示意图](http://regulusun.github.io/images/15184210_Xonl.jpg)
## 内核空间、用户空间 
上图简单描述了数据从磁盘到用户进程的内存区域移动的过程，其间涉及到了内核空间与用户空间。这两个空间有什么区别呢？ 
用户空间就是常规进程（如JVM）所在区域，用户空间是非特权区域，如不能直接访问硬件设备。内核空间是操作系统所在区域，那肯定是有特权啦，如能与设备控制器通讯，控制用户区域的进程运行状态。进程执行I/O操作时，它执行一个系统调用把控制权交由内核。 
## 虚拟内存 
## 内存页面调度 

# 5种I/O模型
说起I/O模型，网络上有一个错误的概念，异步非阻塞/阻塞模型，其实异步根本就没有阻不阻塞之说，异步模型就是异步模型。让我们来看一看Richard Stevens在其UNIX网络编程卷1中提出的5个I/O模型吧。

+ 阻塞式I/O  
![阻塞式I/O](http://regulusun.github.io/images/15184212_GdVp.png)
+ 非阻塞式I/O  
![非阻塞式I/O](http://regulusun.github.io/images/15184217_zZm1.png)
+ I/O复用（Java NIO就是这种模型）  
![I/O复用](http://regulusun.github.io/images/15184220_G7XH.png)
+ 信号驱动式I/O
+ 异步I/O  
![异步I/O](http://regulusun.github.io/images/15184226_0FqM.png)

由POSIX术语定义，同步I/O操作导致请求进程阻塞，直到I/O操作完成；异步I/O操作不导致请求进程阻塞。5种模型中的前4种都属于同步I/O模型。

# Why NIO?
开始讲NIO之前，了解为什么会有NIO，相比传统流I/O的优势在哪，它可以用来做什么等等的问题，还是很有必要的。
传统流I/O是基于字节的，所有I/O都被视为单个字节的移动；而NIO是基于块的，大家可能猜到了，NIO的性能肯定优于流I/O。没错！其性能的提高 要得益于其使用的结构更接近操作系统执行I/O的方式：通道和缓冲器。我们可以把它想象成一个煤矿，通道是一个包含煤层（数据）的矿藏，而缓冲器则是派送 到矿藏的卡车。卡车载满煤炭而归，我们再从卡车上获得煤炭。也就是说，我们并没有直接和通道交互；我们只是和缓冲器交互，并把缓冲器派送到通道。通道要么 从缓冲器获得数据，要么向缓冲器发送数据。（这段比喻出自Java编程思想）  

NIO的主要应用在高性能、高容量服务端应用程序，典型的有Apache Mina就是基于它的。

# 缓冲区 
缓冲区实质上就是一个数组，但它不仅仅是一个数组，缓冲区还提供了对数据的结构化访问，而且还可以跟踪系统的读/写进程。为什么这么说呢？下面来看看缓冲区的细节。 
讲缓冲区细节之前，我们先来看一下缓冲区“家谱”：
![缓冲区家谱](http://regulusun.github.io/images/15184235_1a1r.png)

## 内部细节
缓冲区对象有四个基本属性： 
+ 容量Capacity：缓冲区能容纳的数据元素的最大数量，在缓冲区创建时设定，无法更改 
+ 上界Limit：缓冲区的第一个不能被读或写的元素的索引 
+ 位置Position：下一个要被读或写的元素的索引 
+ 标记Mark：备忘位置，调用mark()来设定mark=position，调用reset()设定position=mark 

这四个属性总是遵循这样的关系：0<=mark<=position<=limit<=capacity。下图是新创建的容量为10的缓冲区逻辑视图：  
![缓冲区逻辑视图](http://regulusun.github.io/images/15184237_ffbM.png)
`buffer.put((byte)'H').put((byte)'e').put((byte)'l').put((byte)'l').put((byte)'o');`  
五次调用put后的缓冲区：  
`buffer.put(0,(byte)'M').put((byte)'w');`  
![缓冲区逻辑视图](http://regulusun.github.io/images/15184241_NUYi.png)  
调用绝对版本的put不影响position：  
![缓冲区逻辑视图](http://regulusun.github.io/images/15184246_0SbU.png)  
现在缓冲区满了，我们必须将其清空。我们想把这个缓冲区传递给一个通道，以使内容能被全部写出，但现在执行get()无疑会取出未定义的数据。我们必须将 posistion设为0，然后通道就会从正确的位置开始读了，但读到哪算读完了呢？这正是limit引入的原因，它指明缓冲区有效内容的未端。这个操作 在缓冲区中叫做翻转：`buffer.flip()`。   
![缓冲区逻辑视图](http://regulusun.github.io/images/15184249_V47C.png)  
rewind操作与flip相似，但不影响limit。 
将数据从输入通道copy到输出通道的过程应该是这样的：
 
```java
while (true) {
     buffer.clear();  // 重设缓冲区以便接收更多字节
     int r = fcin.read( buffer );

     if (r==-1) {
       break;
     }

     buffer.flip(); // 准备读取缓冲区数据到通道
     fcout.write( buffer );
}
```

## 创建缓冲区 
一般，新分配一个缓冲区是通过allocate方法的。如果你想提供自己的数组用做缓冲区的备份存储器，请调用wrap方法。 
上面两种方式创建的缓冲区都是间接的，间接的缓冲区使用备份数组（相关的方法有hasArray()、array()、arrayOffset()）。 
## 复制缓冲区 
duplicate方法创建一个与原始缓冲区类似的缓冲区，两个缓冲区共享数据元素，不过它们拥有各自的position、limit、mark，如下图：
![缓冲区逻辑视图](http://regulusun.github.io/images/15184253_UYu7.png) 
另一个方法，slice与duplicate相似，但slice方法创建一个从原始缓冲区的当前位置开始的新缓冲区，而且容量是原始缓冲区的剩余元素数量（limit-position），见下图。
![缓冲区逻辑视图](http://regulusun.github.io/images/15184256_zghT.png)
## 字节缓冲区 
### 字节序 
为什么会有字节序？比如有1个int类型数字0x036fc5d9，它占4个字节 ，那么在内存中存储时，有可能其最高字节03位于低位地址（大端字节顺序），也有可能最低字节d9位于低位地址（小端字节顺序）。 
在IP协议中规定了使用大端的网络字节顺序，所以我们必须先在本地主机字节顺序和通用的网络字节顺序之间进行转换。java.nio中，字节顺序由ByteOrder类封装。 
在ByteBuffer中默认字节序为ByteBuffer.BIG_ENDIAN，不过byte为什么还需要字节序呢？ByteBuffer和其他基本 数据类型一样，具有大量便利的方法用于获取和存放缓冲区内容，这些方法对字节进行编码或解码的方式取决于ByteBuffer当前字节序。 
+ 直接缓冲区 
直接缓冲区是通过调用ByteBuffer.allocateDirect方法创建的。通常直接缓冲区是I/O操作的最好选择，因为它避免了一些复制过程；但可能也比间接缓冲区要花费更高的成本；它的内存是通过调用本地操作系统方面的代码分配的。 
+ 视图缓冲区 
视图缓冲区和缓冲区复制很像，不同的只是数据类型，所以字节对应关系也略有不同。比如ByteBuffer.asCharBuffer，那么转换后的缓冲区通过get操作获得的元素对应备份存储中的2个字节。 
### 如何存取无符号整数？ 
Java中并没有直接提供无符号数值的支持，每个从缓冲区读出的无符号值被升到比它大的下一个数据类型中。
 
```java
    public static short getUnsignedByte(ByteBuffer bb) {
        return ((short) (bb.get() & 0xff));
    }

    public static void putUnsignedByte(ByteBuffer bb, int value) {
        bb.put((byte) (value & 0xff));
}
```

# 通道
通道用于在缓冲区和位于通道另一侧的实体（文件、套接字）之间有效的传输数据。相对于缓冲区，通道的“家谱”略显复杂：
![通道的家谱](http://regulusun.github.io/images/15184300_0xJS.png)
## 使用通道 
打开通道比较简单，除了FileChannel，都用open方法打开。 
我们知道，通道是和缓冲区交互的，从缓冲区获取数据进行传输，或将数据传输给缓冲区。从类继承层次结构可以看出，通道一般都是双向的（除FileChannel）。 
下面来看一下通道间数据传输的代码：
 
```java
    private static void channelCopy(ReadableByteChannel src,
                                     WritableByteChannel dest)
            throws IOException {
        ByteBuffer buffer = ByteBuffer.allocateDirect(16 * 1024);
        while (src.read(buffer) != -1) {
            // Prepare the buffer to be drained
            buffer.flip();
            // Write to the channel; may block
            dest.write(buffer);
            // If partial transfer, shift remainder down
            // If buffer is empty, same as doing clear( )
            buffer.compact();
        }
        // EOF will leave buffer in fill state
        buffer.flip();
        // Make sure that the buffer is fully drained
        while (buffer.hasRemaining()) {
            dest.write(buffer);
        }
}
```
## 关闭通道 
通道不能被重复使用，这点与缓冲区不同；关闭通道后，通道将不再连接任何东西，任何的读或写操作都会导致ClosedChannelException。 
调用通道的close()方法时，可能会导致线程暂时阻塞，就算通道处于非阻塞模式也不例外。如果通道实现了InterruptibleChannel接 口，那么阻塞在该通道上的一个线程被中断时，该通道将被关闭，被阻塞线程也会抛出ClosedByInterruptException异常。当一个通道 关闭时，休眠在该通道上的所有线程都将被唤醒并收到一个AsynchronousCloseException异常。 
## 发散、聚集 
发散、聚集，又被称为矢量I/O，简单而强大的概念，它是指在多个缓冲区上实现一个简单的I/O操作。它减少或避免了缓冲区的拷贝和系统调用，它应该使用直接缓冲区以从本地I/O获取最大性能优势。 
## 文件通道 
## Socket通道 
Socket通道有三个，分别是ServerSocketChannel、SocketChannel和DatagramChannel，而它们又分别对 应java.net包中的Socket对象ServerSocket、Socket和DatagramSocket；Socket通道被实例化时，都会创 建一个对等的Socket对象。 
Socket通道可以运行非阻塞模式并且是可选择的，非阻塞I/O与可选择性是紧密相连的，这也正是管理阻塞的API要在 SelectableChannel中定义的原因。设置非阻塞非常简单，只要调用configureBlocking(false)方法即可。如果需要中 途更改阻塞模式，那么必须首先获得blockingLock()方法返回的对象的锁。 
### ServerSocketChannel 
ServerSocketChannel是一个基于通道的socket监听器。但它没有bind()方法，因此需要取出对等的Socket对象并使用它来 绑定到某一端口以开始监听连接。在非阻塞模式下，当没有传入连接在等待时，其accept()方法会立即返回null。正是这种检查连接而不阻塞的能力实 现了可伸缩性并降低了复杂性，选择性也因此得以实现。
 
```java
    ByteBuffer buffer = ByteBuffer.wrap("Hello World".getBytes());
    ServerSocketChannel ssc = ServerSocketChannel.open();
    ssc.socket().bind(new InetSocketAddress(12345));
    ssc.configureBlocking(false);

    for (;;) {
        System.out.println("Waiting for connections");
        SocketChannel sc = ssc.accept();
        if (sc == null)
            TimeUnit.SECONDS.sleep(2000);
        else {
            System.out.println("Incoming connection from:" + sc.socket().getRemoteSocketAddress());
            buffer.rewind();
            sc.write(buffer);
            sc.close();
        }
       }
```
### SocketChannel 
相对于ServerSocketChannel，它扮演客户端，发起到监听服务器的连接，连接成功后，开始接收数据。 
要注意的是，调用它的open()方法仅仅是打开但并未连接，要建立连接需要紧接着调用connect()方法；也可以两步合为一步，调用open(SocketAddress remote)方法。 
你会发现connect()方法并未提供timout参数，作为替代方案，你可以用isConnected()、isConnectPending()或finishConnect()方法来检查连接状态。 
### DatagramChannel 
不同于前面两个通道对象，它是无连接的，它既可以作为服务器，也可以作为客户端。 

# 选择器
选择器提供选择执行已经就绪的任务的能力，这使得多元I/O成为可能。就绪选择和多元执行使得单线程能够有效率地同时管理多个I/O通道。选择器可谓NIO中的重头戏，I/O复用的核心，下面我们来看看这个神奇的东东。
## 基础概念 
我们先来看下选择器相关类的关系图：
![选择器类关系图](http://regulusun.github.io/images/15184306_013A.png)
由图中可以看出，选择器类Selector并没有和通道有直接的关系，而是通过叫选择键的对象SelectionKey来联系的。选择键代表了通道与选择 器之间的一种注册关系，channel()和selector()方法分别返回注册的通道与选择器。由类图也可以看出，一个通道可以注册到多个选择器；注 册方法register()是放在通道类里，而我感觉放在选择器类里合适点。 
非阻塞特性与多元执行的关系非常密切，如果在阻塞模式下注册一个通道，系统会抛出IllegalBlockingModeException异常。 
那么，通道注册到选择器后，选择器又是如何实现就绪选择的呢？真正的就绪操作是由操作系统来做的，操作系统处理I/O请求并通知各个线程它们的数据已经准备好了，而选择器类提供了这种抽象。 
选择键作为通道与选择器的注册关系，需要维护这个注册关系所关心的通道操作interestOps()以及通道已经准备好的操作readyOps()，这 两个方法的返回值都是比特掩码，另外ready集合是interest集合的子集。选择键类中定义了4种可选择操作：read、write、 connect和accept。类图中你可以看到每个可选择通道都有一个validOps()的抽象方法，每个具体通道各自有不同的有效的可选择操作集 合，比如ServerSocketChannel的有效操作集合是accept，而SocketChannel的有效操作集合是read、write和 connect。 
回过头来再看下注册方法，其第二个参数是一个比特掩码，这个参数就是上面讲的这个注册关系所关心的通道操作。在选择过程中，所关心的通道操作可以由方法 interestOps(int operations)进行修改，但不影响此次选择过程（在下一次选择过程中生效）。 
## 使用选择器 
### 选择过程 
类图中可以看出，选择器类中维护着两个键的集合：已注册的键的集合keys()和已选择的键的集合selectedKeys()，已选择的键的集合是已注 册的键的集合的子集。已选择的键的集合中的每个成员都被选择器（在前一个选择操作中）判断为已经准备好（所关心的操作集合中至少一个操作）。 除此之外，其实选择器内部还维护着一个已取消的键的集合，这个集合包含了cancel()方法被调用过的键。 
选择器类的核心是选择过程，基本上来说是对select()、poll()等系统调用的一个包装。那么，选择过程的具体细节或步骤是怎样的呢？ 
当选择器类的选择操作select()被调用时，下面的步骤将被执行：
 
1. 已被取消的键的集合被检查。如果非空，那么该集合中的键将从另外两个集合中移除，并且相关通道将被注销。这个步骤结束后，已取消的键的集合将为空。 
2. 已注册的键的集合中的键的interest集合将被检查。在这个步骤执行过后，对interset集合的改动不会影响剩余的检查过程。一旦就绪条件被 确定下来，操作系统将会进行查询，以确定每个通道所关心的操作的真实就绪状态。这可能会阻塞一段时间，最终每个通道的就绪状态将确定下来。那些还没有准备 好的通道将不会执行任何操作；而对于那些操作系统指示至少已经准备好interest集合中的一个操作的通道，将执行以下两种操作中的一种：   
a.如果通道的键还没有在已选择的键的集合中，那么键的ready集合将被清空，然后表示操作系统发现的当前通道已经准备好的操作的比特掩码将被设置。   
b.如果通道的键已处于已选择的键的集合中，键的ready集合将被表示操作系统发现的当前通道已经准备好的操作的比特掩码所更新，所有之前的已经不再是就绪状态的操作不会被清除。 
3. 步骤2可能会花费很长时间，特别是调用的线程处于休眠状态。同时，与选择器相关的键可能会被取消。当步骤2结束时，步骤1将重新执行，以完成任意一个在选择过程中，键已经被取消的通道的注销。 
4. select操作返回的值是ready集合在步骤2中被修改的键的数量，而不是已选择键的集合中的通道总数。返回值不是已经准备好的通道的总数，而是 从上一个select调用之后进入就绪状态的通道的数量。之前调用中就绪的，并且在本次调用中仍然就绪的通道不会被计入。 
### 停止选择过程
选择器类提供了方法wakeup()，可以使线程从被阻塞的select()方法中优雅的退出，它将选择器上的第一个还没有返回的选择操作立即返回。 
调用选择器类的close()方法，那么任何一个阻塞在选择过程中的线程将被唤醒，与选择器相关的通道将被注销，而键将被取消。 
另外，选择器类也能捕获InterruptedException异常并调用wakeup()方法。 
## 并发性 
### 选择过程的可扩展性 
在单cpu中使用一个线程为多个通道提供服务可能是个好主意，但对于多cpu的系统，单线程必然比多线程在性能上要差很多。 
一个比较不错的多线程策略是，以所有的通道使用一个选择器（或多个选择器，视情况），并将以就绪通道的服务委托给其他线程。用一个线程监控通道的就绪状态，并使用一个工作线程池来处理接收到的数据。讲了这么多，下面来看一段用NIO写的简单服务器代码：
 
```java
private void run(int port) throws IOException {
    // Allocate buffer
    ByteBuffer echoBuffer = ByteBuffer.allocate(1024);
    // Create a new selector
    Selector selector = Selector.open();

    // Open a listener on the port, and register with the selector
    ServerSocketChannel ssc = ServerSocketChannel.open();
    ssc.configureBlocking(false);
    ServerSocket ss = ssc.socket();
    InetSocketAddress address = new InetSocketAddress(port);
    ss.bind(address);

    SelectionKey key = ssc.register(selector, SelectionKey.OP_ACCEPT);
    System.out.println("Going to listen on " + port);

    for (;;){
        int num = selector.select();

        Set selectedKeys = selector.selectedKeys();
        Iterator it = selectedKeys.iterator();

        while (it.hasNext()) {
            SelectionKey selectionKey = (SelectionKey) it.next();

            if ((selectionKey.readyOps() & SelectionKey.OP_ACCEPT)
                    == SelectionKey.OP_ACCEPT) {
                // Accept the new connection
                ServerSocketChannel serverSocketChannel = (ServerSocketChannel) selectionKey.channel();
                SocketChannel sc = serverSocketChannel.accept();
                sc.configureBlocking(false);

                // Add the new connection to the selector
                SelectionKey newKey = sc.register(selector, SelectionKey.OP_READ);
                it.remove();

                System.out.println("Got connection from " + sc);
            } else if ((selectionKey.readyOps() & SelectionKey.OP_READ)
                    == SelectionKey.OP_READ) {
                // Read the data
                SocketChannel sc = (SocketChannel) selectionKey.channel();

                // Echo data
                int bytesEchoed = 0;
                while (true) {
                    echoBuffer.clear();
                    int r = sc.read(echoBuffer);
                    if (r <= 0) {
                        break;
                    }
                    echoBuffer.flip();
                    sc.write(echoBuffer);
                    bytesEchoed += r;
                }
                System.out.println("Echoed " + bytesEchoed + " from " + sc);
                it.remove();
            }
        }
    }
}
```
## I/O多路复用模式
I/O多路复用有两种经典模式：基于同步I/O的reactor和基于异步I/O的proactor。
### Reactor 
+ 某个事件处理者宣称它对某个socket上的读事件很感兴趣; 
+ 事件分离者等着这个事件的发生; 
+ 当事件发生了，事件分离器被唤醒，这负责通知先前那个事件处理者; 
+ 事件处理者收到消息，于是去那个socket上读数据了. 如果需要，它再次宣称对这个socket上的读事件感兴趣，一直重复上面的步骤;  

### Proactor 
+ 事件处理者直接投递发一个写操作(当然，操作系统必须支持这个异步操作). 这个时候，事件处理者根本不关心读事件，它只管发这么个请求，它魂牵梦萦的是这个写操作的完成事件。这个处理者很拽，发个命令就不管具体的事情了，只等着别人（系统）帮他搞定的时候给他回个话。 
+ 事件分离者等着这个读事件的完成(比较下与Reactor的不同); 
+ 当事件分离者默默等待完成事情到来的同时，操作系统已经在一边开始干活了，它从目标读取数据，放入用户提供的缓存区中，最后通知事件分离者，这个事情我搞完了; 
+ 事件分享者通知之前的事件处理者: 你吩咐的事情搞定了; 
+ 事件处理者这时会发现想要读的数据已经乖乖地放在他提供的缓存区中，想怎么处理都行了。如果有需要，事件处理者还像之前一样发起另外一个写操作，和上面的几个步骤一样。 
异步的proactor固然不错，但它局限于操作系统（要支持异步操作），为了开发真正独立平台的通用接口，我们可以通过reactor模拟来实现proactor。  

### Proactor（模拟） 
+ 等待事件 (Proactor 的工作) 
+ 读数据(看，这里变成成了让 Proactor 做这个事情) 
+ 把数据已经准备好的消息给用户处理函数，即事件处理者(Proactor 要做的) 
+ 处理数据 (用户代码要做的) 

# 总结
本文介绍了 I/O的一些基础概念及5种I/O模型，NIO是5种模型中的I/O复用模型；接着进入主题Java NIO，分别讲了NIO中三个最重要的概念：缓冲区、通道、选择器；我们也明白了NIO是如何实现I/O复用模型的。最后讨论了I/O多路复用模式中的两 种模式：reactor和proactor，以及如何用reactor模拟proactor。

# 参考资料
+ O'Reilly Java NIO 
+ Richard Stevens《UNIX网络编程 卷1：套接字联网API》 
+ 两种高性能I/O设计模式(Reactor/Proactor)的比较 
+ Understanding Network I/O 
+ Understanding Disk I/O - when should you be worried?
