var items = [ 
{ name: "macbook",
  title: "Macbook Pro 13寸 MC374", 
  price: "2800.00",
  new: "七成新",
  date: "2014-11-4",
  desc: "2010年港行，一直作为开发机自用，后来加装了128GB的镁光ssd，与原来的256GB         SATA硬盘共同使用。机器右侧摔了个小坑，但是没有任何功能上的影响。因换了retina的macbook，所以出了现在这部。"}, 
{ name: "kindle",
  title: "Kindle 3 送官方带灯皮套", 
  price: "199.00",
  new: "六成新",
  date: "2014-11-4",
  desc: "3年前购于美国亚马逊，附带原装皮套，皮套可以直接使用kindle的电池照明。看得少的话，一般1个月充一次电，每天看的话可能2-3周充一次电。功能完好，看英语书的绝配。"}, 
]

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
