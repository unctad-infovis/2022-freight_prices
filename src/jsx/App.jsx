import React, { useState, useEffect } from 'react';
import './../styles/styles.less';

// https://d3js.org/
import * as d3 from 'd3';

// https://www.npmjs.com/package/react-is-visible
import 'intersection-observer';
import { useIsVisible } from 'react-is-visible';

// https://vis4.net/chromajs/
import chroma from 'chroma-js';

// Use chroma to make the color scale.
// https://gka.github.io/chroma.js/
const scaleMax = 8117,
      scaleMin = 725,
      f = chroma.scale(['#009edb', '#72bf44']).domain([scaleMax, scaleMin]),
      f_text = chroma.scale(['#0077b8', '#27933a']).domain([scaleMax, scaleMin]);

let chart_elements,
    height,
    interval,
    width,
    x,
    xAxis,
    y,
    yAxis;

let isVisible = false;
const App = () => {
  const containerRef = React.createRef();
  isVisible = useIsVisible(containerRef);
  const [currentValue, setCurrentValue] = useState(0);
  const [currentDate, setCurrentDate] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState(false);

  useEffect(() => {
    createSvg();
    const data_file = (window.location.href.includes('unctad.org')) ? '/sites/default/files/data-file/2022-freight_prices.json' : './assets/data/data.json';
    try {
      d3.json(data_file).then((json_data) => {
        setData(cleanData(json_data));
      });
    }
    catch (error) {
      console.error(error);
    }
  }, []);

  const cleanData = (data) => {
    data.splice(0, 399);
    return data;
  }

  const createSvg = () => {
    const margin = {top: 0, right: 0, bottom: 0, left: 70};
    width = containerRef.current.clientWidth - margin.left - margin.right;
    height = width / 3;

    x = d3.scaleBand()
      .range([0, width]);
    y = d3.scaleLinear()
      .range([0, height]);

    const svg = d3.select('.chart_container')
      .append('svg')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', width)
      .attr('height', height);
    yAxis = svg.append('g')
      .attr('class', 'yaxis')
      .attr('transform', 'translate(' + (margin.left - 1) + ', ' + margin.top + ')');
    xAxis = svg.append('g')
      .attr('class', 'xaxis')
      .attr('transform', 'translate(' + margin.left + ',' + (height) + ')');
    chart_elements = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  }

  useEffect(() => {
    if (isVisible === true) {
      setTimeout(() => {
        interval = setInterval(() => {
          setCurrentIndex((currentIndex) => currentIndex + 1)
        }, 40);
        return () => clearInterval(interval);
      }, 500);
    }
  }, [isVisible]);

  useEffect(() => {
    if (data !== false) {
      if (currentIndex >= data.length) {
        clearInterval(interval);
      }
      else {
        setCurrentValue(data[currentIndex].value);
        setCurrentDate(data[currentIndex].date);
        updateData();
      }
    }
  }, [currentIndex]);

  const defineTickValues = (chart_data) => {
    let prev_year;
    return chart_data.map((d, i) => {
      if (d.date.substring(d.date.length - 4) !== prev_year) {
        prev_year = d.date.substring(d.date.length - 4);
        return i;
      }
    }).filter(d => d);
  }

  const updateData = () => { // https://www.d3-graph-gallery.com/graph/barplot_button_data_hard.html
    let chart_data = data.map(d => d).slice(0, currentIndex + 1);
    let tick_values = defineTickValues(chart_data);
    x.domain(chart_data.map((data, i) => i));
    xAxis.call(d3.axisBottom(x)
      .tickValues(tick_values)
      .tickFormat(i => data[i].date.substring(data[i].date.length - 4))
    );

    y.domain([Math.max(0, d3.max(chart_data, d => d.value)), Math.min(0, d3.min(chart_data, d => d.value))]);
    yAxis.call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(i => {
        if (i !== 0) {
          return '$' + i.toLocaleString();
        }
      })
      .tickSizeInner(-width)
      .tickSizeOuter(0));

    let bars = chart_elements.selectAll('.bar')
      .data(chart_data);

    bars.exit().remove()

    bars.enter().append('rect')
      .attr('class', 'bar')
      .attr('fill', d => f(d.value))
      .attr('height', 0)
      .attr('width', 0)
      .attr('x', 0)
      .attr('y', y(0))
      .merge(bars)
      .attr('width', x.bandwidth() + 1)
      .attr('height', d => Math.abs(y(d.value) - y(0)))
      .attr('y', d => (d > 0) ? y(Math.max(0, d.value)) : y(Math.max(0, d.value)) + 1)
      .attr('x', (d, i) => x(i));
  }

  return (
    <div className={'app'} ref={containerRef}>
      <div className={'title_container'}>
        <h3>
          <div className={'info_container'}>
            <div className={'date_container'}>{currentDate}</div>
            <div className={'value_container'} style={{color: f_text(currentValue)}}>Price ${currentValue.toLocaleString()}</div>
          </div>
          <div>Shipping costs skyrocketed after<br /> a decade of stable prices</div>
        </h3>
      </div>
      <div className={'chart_container'}></div>
      <img src="//unctad.org/sites/default/files/2022-06/unctad_logo.svg" alt="UNCTAD logo" className={'unctad_logo'} />
      <div className={'source_container'}><em>Note:</em> Shanghai-West Coast North America (base port) $/FEU (forty-foot equivalent unit) between December 2010  and June 2022</div>
      <div className={'note_container'}><em>Source:</em> UNCTAD calculations, based on data from Clarksons Research.</div>
    </div>
  );
};

export default App;
