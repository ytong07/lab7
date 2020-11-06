const width = 640;
const height = 480;
const svg = d3.select(".chart")
    .append("svg")
    .attr("viewBox", [0,0,width,height]);

    
//fetch the json file and store data into array "airports"
Promise.all([ // load multiple files
    d3.json('airports.json'),
    d3.json('world-110m.json')])
    .then(data=>{ 
        // or use destructuring :([airports, wordmap])=>{ ... 
    let airports = data[0]; // data1.csv
    let wordmap = data[1]; // data2.json
    
    let visType = "force";

    console.log("airports",airports);

    const links = airports.links;
    const nodes = airports.nodes;

    let geoMap = topojson.feature(wordmap, wordmap.objects.countries);
    console.log("converted map", geoMap);
    let projection = d3.geoMercator().translate([width/2, height/2]);
    projection.fitExtent([[0,0], [width,height]], geoMap);

    let path = d3.geoPath()
                 .projection(projection);

    let drag = force => {
  
                    function dragstarted(d) {
                      if (!d.active) force.alphaTarget(0.3).restart();
                      d.subject.fx = d.subject.x;
                      d.subject.fy = d.subject.y;
                    }
                    
                    function dragged(d) {
                      d.subject.fx = d.x;
                      d.subject.fy = d.y;
                    }
                    
                    function dragended(d) {
                      if (!d.active) force.alphaTarget(0);
                      d.subject.fx = null;
                      d.subject.fy = null;
                    }
                    
                    return d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                        .filter(event => visType === "force");
                  }

    svg.append("path")
        .datum(geoMap)
        .attr("class", "map")
        .attr("d", path)
        .style("opacity", 0);

    let force = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).distance(25))
                    .force("charge", d3.forceManyBody().strength(-1))
                    .force("center", d3.forceCenter().x(width/2).y(height/2))
                    .on("tick", () => {link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);
                        node
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y);
                        });

    let link = svg.append("g")
                    .attr("stroke", "#999")
                    .selectAll("line")
                    .data(links)
                    .join("line");
              
    let node = svg.append("g")
                    .attr("class", "node")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .selectAll("circle")
                    .data(nodes)
                    .join("circle")
                    .attr("r", (d) => d.passengers/3000000)
                    .attr("fill", "orange")
                    .call(drag(force));
    // console.log("links", link);
    // console.log("nodes", node);
    node.append("title").text(d=>d.name);

    
    d3.selectAll(".radio")
        .on("change", event => {visType = event.target.value;
            switchLayout();})
    
    function switchLayout(){
        if(visType=="map"){
            // stop the simulation
            force.stop();

            // set the positions of links and nodes based on geo-coordinates
            link.transition()
                .duration(650)
                .attr("x1", d => projection([d.source.longitude, d.source.latitude])[0])
                .attr("y1", d => projection([d.source.longitude, d.source.latitude])[1])
                .attr("x2", d => projection([d.target.longitude, d.target.latitude])[0])
                .attr("y2", d => projection([d.target.longitude, d.target.latitude])[1]);
            console.log("link", link);
            node.transition()
                .duration(600)
                .attr("cx", d => projection([d.longitude, d.latitude])[0])           
                .attr("cy", d => projection([d.longitude, d.latitude])[1]);
            
            // set the map opacity to 1
            svg.selectAll("path")
                .transition()
                .duration(500)
                .style("opacity", 1);
                
            node.on("mouseenter", (event, d) => {
                    const pos = d3.pointer(event, window);
                    // create tooltip
                    d3.select("#tooltip")
                    .style('display', 'block')
                    .style('left', pos[0].toString()+'px')
                    .style("top", (pos[1]-80).toString()+'px')
                    .html(d.name.toString());
            
                    //Show the tooltip
                    d3.select("#tooltip").classed("hidden", false)
                  })
                .on("mouseleave", () => d3.select("#tooltip").style('display', 'none'));
        }
        else{
            // force layout
            // restart the simulation
            link 
                .transition()
                .duration(600)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            node
                .transition()
                .duration(600)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            node.on("mouseenter", (event, d) => {
                const pos = d3.pointer(event, window);
                // create tooltip
                d3.select("#tooltip").style("opcity", 0)});
    
            // set the map opacity to 0
            svg.selectAll("path")
                .transition()
                .duration(500)
                .style("opacity", 0);
        }
    }
});