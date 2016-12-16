console.log('Prices');

//First, append <svg> element and implement the margin convention
var m = {t:50,r:50,b:50,l:50};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//Import data and parse
d3.csv('../data/output.csv', parse, dataLoaded);


function parse(d) {
    return {
        id: d['id'],
        price: +d['price'],
        airline: d['airline'],
        duration: +d['duration'],
        travelDate: new Date(d['travelDate'])

    };

}

function dataLoaded(err,rows) {
    // console.table(rows);

    // var sortarr = rows.sort(function (a, b) {
    //         return b.airline - a.airline;
    //     }),
    //     data1 = sortarr.slice(0, 5);
    // console.log(sortarr, data1)


    var prices = d3.nest()
        .key(function (d) {
            return d.airline
        })
        .rollup(function (values) {
            return d3.mean(values, function (d) {
                return d.price;
            })
        })
        .entries(rows);
    console.log(prices);
    var scaleX = d3.scaleBand()
        .domain(["B6", "UA", "SY", "VX", "AS", "AC"])
        .range([0,w])
        .padding(.3);
    var scaleY = d3.scaleLinear().domain([600, 0]).range([0, h])
//Line generator
    var lineGenerator = d3.line()
        .x(function (d) {
            return scaleX(airline(d.key))
        })
        .y(function (d) {
            return scaleY(d.averagePrice)
        })
        .curve(d3.curveCardinal);


//make bar
    var bar = plot.selectAll('rect')
        .data(prices)
        .enter().append('rect')
        .attr('class', function(d){
            console.log(d, d.key, "+", " bar", d.key+' bar')
            return d.key+' bar';
        })
        .style('width', scaleX.bandwidth())
        .style('height', function (d) {
            return h - scaleY(d.value)
        })
        .attr('y', function (d) {
            console.log(d.value, scaleY(d.value));
            return scaleY(d.value)
        })
        .attr('x', function (d) {
            return scaleX(d.key)
        });

//Axis
    var axisX = d3.axisBottom()
        .scale(scaleX)
        .tickSize(-h);
    var axisY = d3.axisLeft()
        .scale(scaleY)
        .tickSize(-w);

    var axisNodeX = plot.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + 0 + ',' + h + ')'),
        axisNodeY = plot.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')');
    axisX(axisNodeX);
    axisY(axisNodeY);
}