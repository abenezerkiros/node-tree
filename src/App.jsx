import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TreeChart = ({ data }) => {
  const svgRef = useRef();
  let i = 0;

  useEffect(() => {
    const width = window.innerWidth; 
    const height = window.innerHeight;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', 'translate(80,40)');

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    const root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    root.children.forEach(collapse); 
    const treeLayout = d3.tree().size([width, height - 160]);

    update(root);

    function update(source) {
      const treeData = treeLayout(root);
      const nodes = root.descendants();
      const links = root.links();

      nodes.forEach(d => d.y = d.depth * 180);

      const node = g.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.x0},${source.y0})`)
        .on('click', onClick);

      // Assign colors based on depth and tree structure
      nodeEnter.append('rect')
        .attr('width', 100)
        .attr('height', 50)
        .attr('x', -50)
        .attr('y', -25)
        .attr('fill', d => {
          if (d.depth === 0) return '#b4e7a0';  // Main Goal - Light green
          if (d.depth === 1) return d.data.name.includes('Key Task 1') ? '#f8c291' : '#a3c9f1'; // Key Task 1 - Orange, Key Task 2 - Light blue
          return d.ancestors().some(ancestor => ancestor.data.name === 'Key Task 1') ? '#f9cc9d' : '#c1e1f8';  // Descendants of Key Task 1 - light orange, Key Task 2 - light blue
        })
        .attr('stroke', '#666')
        .attr('stroke-width', 1)
        .attr('rx', 8)
        .attr('ry', 8)
        .style('transform-origin', 'center')  
        .style('transform', 'rotateY(90deg) scale(0.8)')  
        .transition()
        .duration(750)
        .delay((d, i) => i * 100)  
        .style('transform', 'rotateY(0deg) scale(1)');

      nodeEnter.append('text')
        .attr('dy', 5)
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .text(d => d.data.name)
        .style('opacity', 0)
        .transition()
        .duration(750)
        .delay((d, i) => i * 100)
        .style('opacity', 1);

      const nodeUpdate = nodeEnter.merge(node);
      nodeUpdate.transition()
        .duration(750)
        .attr('transform', d => `translate(${d.x},${d.y})`);

      const nodeExit = node.exit().transition()
        .duration(750)
        .attr('transform', d => `translate(${source.x},${source.y})`)
        .remove();

      const link = g.selectAll('path.link')
        .data(links, d => d.target.id);

      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#555')
        .attr('stroke-width', 2)
        .attr('d', d => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        })
        .attr('stroke', '#FF6347') 
        .transition()
        .duration(750)
        .attr('d', d => diagonal(d.source, d.target))
        .attr('stroke', '#555'); 

      link.transition()
        .duration(750)
        .attr('d', d => diagonal(d.source, d.target));

      link.exit().transition()
        .duration(750)
        .attr('d', d => {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function onClick(event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);

      const [x, y] = [d.x, d.y];

      const scaleFactor = 1.5;

      const translateX = width / 2 - scaleFactor * x;
      const translateY = height / 2 - scaleFactor * y;

      svg.transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scaleFactor)
        );

      updateBreadcrumbs(d);
    }

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d.children.forEach(collapse);
        d.children = null;
      }
    }

    function diagonal(s, d) {
      return `M${s.x},${s.y}C${(s.x + d.x) / 2},${s.y},${(s.x + d.x) / 2},${d.y},${d.x},${d.y}`;
    }

    function updateBreadcrumbs(d) {
      const ancestors = d.ancestors().reverse(); 
      const breadcrumbs = d3.select('.breadcrumbs')
        .selectAll('div')
        .data(ancestors, d => d.data.name);

      breadcrumbs.enter().append('div')
        .style('display', 'inline-block')
        .style('margin-right', '5px')
        .text(d => d.data.name);

      breadcrumbs.exit().remove();
    }
  }, [data]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default function App() {
  const data = {
    name: "Main Goal",
    children: [
      {
        name: "Key Task 1",
        children: [
          { name: "Task 1", children: [{ name: "Sub Task 1" }, { name: "Sub Task 2", children: [{ name: "Sub Task 2" }] }] },
          { name: "Task 2", children: [{ name: "Sub Task 1" }] }
        ]
      },
      {
        name: "Key Task 2",
        children: [
          { name: "Task 1", children: [{ name: "Sub Task 1" }, { name: "Sub Task 2" }] },
          { name: "Task 2", children: [{ name: "Sub Task 1" , children: [{ name: "sub Task 2" },{ name: "Sub Task 2" }] }, { name: "Sub Task 2" }] }
        ]
      }
    ]
  };

  return <TreeChart data={data} />;
}
