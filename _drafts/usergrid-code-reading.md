# usergrid代码阅读
+ usergrid是多租户的架构，也是面向关系的架构，其核心包括entity和relation
+ relation分为collection和connection两种，collection表示一对多的这种集合关系，而connection表示赞、喜欢、关注、评论等用户行为的一种特殊关系，类似UML类图中两个类的连接关系
+ entity是面向搜索引擎的（EntityProperty注解与PropertyInfo对应）
`@EntityProperty(required = true, mutable = false, basic = true, indexed = false) 
public UUID getUuid();`
basic没有引用 | indexed与fulltextIndexed的区别是什么？
fulltextIndexed无引用，可能是1期还没接入搜索引擎时，数据库的全文检索标记
mutable应该是标记entity的属性是否可变，在更新entity属性时需要判断是否可以更新、删除
required用途和mutable基本类似，除了更新，还用在getEntityJsonSchema时用来判断需不需要在jsonSchema中包含这个属性
+ usergrid既使用了spring，也使用guice，用GuiceAdapterBeanFactory类来作适配
+ CP代表CassandraPersistence，不是CAP中的CP，cassandra实现了AP
+ Schema.init 定义entity packages -> 扫描包下面的entity并注册，通过EntityProperty，EntityCollection及EntityDictionary获取三个注解的值，初始化EntityInfo
+ 计数 正向计数   反向计数
+ usergrid模拟了hbase的MVCC（在collection模块中），cassandra中rowkey重复会覆盖，而hbase中则会维护一个新版本的数据
+ usergrid支持数据迁移，common/migration中实现
+ collection模块中的serialzation负责读写cassandra，写是多版本的；
+ 序列化接口`MutationBatch mark( ApplicationScope context, Id entityId, UUID version );`，是逻辑删除，用于mark+sweep系统
+ netflix astyanax  Astyanax is a high level Java client for Apache Cassandra
+ common模块由一些常用类库组成
+ model模块定义SchemaManager，entity，field
+ Edge定义的是关系这条边，MarkedEdge标记删除，
+ ScopedRowKey定义了多租户系统下的rowkey，BucketScopedRowKey一致hash?
+ EdgeMetadataSerializationV2Impl中定义了与边相关的几个列簇，如Graph_Source_Edge_Types_V2，Graph_Source_Edge_Id_Types_V2，Graph_Target_Edge_Types_V2，Graph_Target_Edge_Id_Types_V2；在writeEdge中可以看出，创建edge时会建立双向（source&target）关系（边）
+ CF_SOURCE_EDGE_TYPES（Graph_Source_Edge_Types_V2） 定义源节点出发的所有边类型，Graph_Source_Edge_Types_V2   scopeId+sourceId:edgeType:null
+ CF_SOURCE_EDGE_ID_TYPES（Graph_Source_Edge_Id_Types_V2），定义所有从源节点出发的目的节点的【id】类型，Graph_Source_Edge_Id_Types_V2 scopeId+sourceId+edgeType:targetType:null
+ CF_TARGET_EDGE_TYPES（Graph_Target_Edge_Types_V2），与CF_SOURCE_EDGE_TYPES正好相反，定义所有到目的节点的边类型，scopeId+targetId:edgeType:null，存储上可能有点冗余，但对搜索引擎友好
+ CF_TARGET_EDGE_ID_TYPES（Graph_Target_Edge_Id_Types_V2），与CF_SOURCE_EDGE_ID_TYPES相反，scopeId+targetId+edgeType:sourceType:null
+ 这种正反关系都存储的方式，虽然冗余，但有利于关系计算，无论是从target还是从source节点出发，都可以轻易查找或计算相关的边（关系）；所以关系的计算就直接从DB获取数据计算即可，不需要借助搜索引擎
+ EdgeMetadataSerialization与EdgeSerialization的区别在于，一个写基本元数据，一个写版本信息
+ Graph_Source_Node_Edges scopeId+sourceNodeId+type+shardIndex:DirectedEdge:isDeleted
+ Graph_Source_Node_Target_Type scopeId+sourceNodeId+type+targetId+shardIndex:DirectedEdge:isDeleted
+ SizebasedEdgeColumnFamilies
+ Graph_Target_Node_Edges  Graph_Target_Node_Source_Type
+ Graph_Edge_Versions存储了边的版本
+ EntityToMapConverter Entity转换成ES的document
+ ES中只创建了NodeType=TARGET类型的entity文档
+ 关于边（关系，或collection，或connection）的需求
  1.源节点出发的所有边   loadEdgesFromSource
  2.到目的节点的所有边    loadEdgesToTarget
  3.从源节点出发，并且类型为users的所有边   loadEdgesFromSourceByType
  4.到目的节点，并且类型为following的所有边  loadEdgesToTargetByType
  5.获取从源节点出发的所有边类型  getEdgeTypesFromSource
  6.
+ 创建一个entity的过程
+ Schema的设计亮点 
  