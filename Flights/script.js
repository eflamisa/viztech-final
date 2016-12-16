console.log('flights');

var m = {t:100,r:100,b:100,l:100};
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


//d3.set to hold a unique array of airlines
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);
var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue', '#333']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);


var scaleXAirlines = d3.scaleOrdinal()
    .range(d3.range(0, w, w/6));


//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);

//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(new Date(d.key))})
    .y(function(d){return scaleY(d.averagePrice)})
    .curve(d3.curveCardinal);

d3.queue()
    .defer(d3.csv, '../data/output.csv',parse)
    .await(function(err, data){

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );
        scaleColor.domain( airlines.values() );


        plot.append('path').attr('class','time-series');

        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){
                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)

                var newarr=data.filter(function(el){return el.airline==d})
                draw(newarr)

                //How do we then update the dots?
            });

        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        draw(data);

    });

function draw(rows){
    //IMPORTANT: data transformation
    var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
        day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });

    flightsByTravelDate.sort(function(a,b){return new Date(a.key)-new Date(b.key)})

    console.table(flightsByTravelDate);

    //Draw dots

    var update=plot.selectAll('.node')
        .data(rows, function(d){d.id})

    var enter=update.enter()
        .append('circle')
        .attr('class','node')
        .on('click', function(d){console.log(d.price)})
        .on('mouseenter', function(d){
            var tooltip=d3.select('.custom-tooltip');
            tooltip.select('.title')
                .html(d.airline + ',' + d.travelDate.toLocaleDateString());
            tooltip.select('.value')
                .html('Price: $ +d.price');

            tooltip.transition().style('opacity', 1);

            d3.select(this).style('stroke-width', '2px');
        })
        .on('mousemove', function(d){
            var tooltip=d3.select('.custom-tooltip');
            var xy = d3.mouse(d3.select('.container').node());
            tooltip
                .style('left', xy[0]+10+'px')
                .style('top', xy[1]+10+'px');
        })

        .on('mousemove',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.transition().style('opacity',0);
            d3.select(this).style('stroke-width','0px');

        });
    update.exit().remove();
    update
        .merge(enter)
        .attr('fill', function(d){return scaleColor(d.airline)})
        .attr('r',3)
        .attr('cy',function(d){return scaleY(d.price)})
        .attr('cx', function(d){return scaleX(d.travelDate)})




    //Draw <path>


    plot.select('.time-series')
        .datum(flightsByTravelDate)
        .transition()
        .attr('d', function(el){return lineGenerator(flightsByTravelDate);})
        .style('fill','none')
        .style('stroke-width',2+'px')
        .style('stroke', function(co){return scaleColor(co[0].values[0].airline)})

}

function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}