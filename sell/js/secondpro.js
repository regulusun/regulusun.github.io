var items = [ 
{ name: "atx750",
  title: "捷安特atx750山地变速自行车", 
  price: "800.00",
  original_price: "1300.00",
  new: "七成新",
  date: "2014-11-4",
  desc: "从别人手上收来的2收车，买来保养过。本打算骑行西藏的，实际上只在云南骑行了大概300公里就一直没骑过。保养时换过全新的刹车线。仅限广州面交。"}, 
{ name: "jp8",
  title: "零售店购买的大行jp8", 
  price: "3200.00",
  original_price: "5400.00",
  new: "七成新",
  date: "2014-11-4",
  desc: "在专卖店买来骑行海南后，就没怎么出过远门了，Q叉前后避震。轻量改装了刹把、脚踏，安装了超级实用的泥档。仅限广州面交。"}, 
{ name: "macbook",
  title: "Macbook Pro 13寸 MC374", 
  price: "已出",
  original_price: "8500.00",
  new: "七成新",
  date: "2014-11-4",
  desc: "最近换了rmbp，所以出这部自用开发机。2010年港行，功能无损、外观成色垃圾，机器右侧很久之前曾经摔了一个坑出来。已经加装了128GB的镁光ssd，与原来的256GBSATA硬盘共同使用。"}
{ name: "muji_bag",
  title: "无印良品电脑包", 
  price: "210",
  original_price: "400",
  new: "七成新",
  date: "2014-11-11",
  desc: "无印良品的电脑包，现在上班都背包了用不着，这个包可以斜背，提手的地方非常结实，内格丰富，两边还有不用拉链的储物空间，可以放得下15寸的电脑。"}, 
]


// draft items
// { name: "kindle",
  //title: "Kindle 4 送官方带灯皮套", 
  //price: "250.00",
  //original_price: "800.00",
  //new: "六成新",
  //date: "2014-11-4",
  //desc: "3年前购于美国亚马逊，附带原装皮套，皮套可以直接使用kindle的电池照明。看得少的话，一般1个月充一次电，每天看的话可能2-3周充一次电。功能完好，看英语书的绝配。"}, 
  
$(function() {
    for ( i = 0; i< items.length; i++) {
        renderItem(items[i]);
    }
    $("#loading").hide();
});

function renderItem(itemJson) {
    var template = $('#itemTemplate').html();
    Mustache.parse(template);
    var rendered = Mustache.render(template, itemJson);
    $("#sell").append(rendered);
}
