// TODO:
// - vertical alignment of x-axis label (Safari)
// - resize graph when window size is changed and simulation is running

function get_numeric(params,name,default_value) {
    var value = default_value;
    if(name in params) {
        var pvalue = params[name];
        if($.isNumeric(pvalue)) value = pvalue;
    }
    return value-0;
}

function CoinApp() {
    console.log('created new CoinApp');
}

// Parameters are:
// 'period': number of milliseconds per complete spin of the coin.
// 'interval': frame update interval in milliseconds.
// 'samples': maximum number of samples to display in the graph.
CoinApp.prototype.initialize = function(params) {
    console.log('initializing...',params);
    this.period_ms = get_numeric(params,'period',10000);
    this.frame_interval_ms = get_numeric(params,'interval',50);
    this.max_samples = get_numeric(params,'samples',200);
    self = this;
    this.running = false;
    // The measure button is initially disabled.
    this.measure_next_update = false;
    measure_button = $('#measure-button');
    measure_button.prop('disabled',true);
    measure_button.click(function() {
        // Flag that we will perform a measurement during the next update.
        self.measure_next_update = true;
    });
    // Initialize our slider.
    this.slider = $('#slider-placeholder').slider({
		formatter: function(value) {
			return value + '\u00B0'; // append degree symbol
		}
	});
    // The pause button is initially hidden.
    this.pause_button = $('#pause-button');
    this.pause_button.hide();
    this.paused = false;
    this.pause_button.click(function() {
        if(self.paused) {
            self.pause_button.text('pause');
            measure_button.prop('disabled',false);
            self.paused = false;
        }
        else {
            self.paused = true;
            measure_button.prop('disabled',true);
            self.pause_button.text('resume');
        }
    });
    // Prepare to toggle between the running / stopped states.
    start_button = $('#start-button');
    start_button.click(function() {
        start_button.prop('disabled',true);
        if(self.running) {
            measure_button.prop('disabled',true);
            $('.model-select').removeClass('disabled');
            self.slider.slider('enable');
            self.stop_animation();
            self.running = false;
            self.pause_button.hide();
            // Reset the coin display.
            self.update_coin(self.slider.slider('getValue')-0,
                $('.model-select input:checked').val() == 'quantum');
            start_button.text('Start');
        }
        else {
            measure_button.prop('disabled',false);
            $('.model-select').addClass('disabled');
            self.slider.slider('disable');
            self.start_animation();
            self.running = true;
            start_button.text('Reset');
            self.pause_button.text('pause');
            self.paused = false;
            self.pause_button.show();
        }
        start_button.prop('disabled',false);
    });
    // Initialize the coin display.
    this.red_shader = d3.interpolateRgb(d3.rgb(128,0,0),d3.rgb(255,96,96));
    this.blue_shader = d3.interpolateRgb(d3.rgb(0,0,128),d3.rgb(96,96,255));
    this.update_coin(this.slider.slider('getValue')-0,
        $('.model-select input:checked').val() == 'quantum');
    // The coin angle tracks changes to the initial state slider and quantum/classical
    // flip switch (which only happen when we are stopped).
    $('.initializer').bind('change', function(event,ui) {
        self.update_coin(self.slider.slider('getValue')-0,
            $('.model-select input:checked').val() == 'quantum');
    });
}

// Update the coin SVG elements to represent the coin at the specified rotation angle.
CoinApp.prototype.update_coin = function(angle_in_degrees,quantum) {
    // Hide all coin graphics by default.
    $('#coin > *').attr('visibility','hidden');
    var angle_in_rad = Math.PI/180.*angle_in_degrees
    var cos_angle = Math.cos(angle_in_rad);
    var sin_angle = Math.sin(angle_in_rad);
    if(Math.abs(cos_angle) < 1e-10) {
        // 90 or 270 degrees is edge-on.
        if(quantum) {
            if(sin_angle < 0) {
                // 270 degrees is edge-on with red on the RHS.
                d3.select('#left-blue-behind').attr('visibility','visible');
                d3.select('#right-red-behind').attr('visibility','visible');
            }
            else {
                d3.select('#left-red-behind').attr('visibility','visible');
                d3.select('#right-blue-behind').attr('visibility','visible');
            }
        }
        d3.select('#edge-on').attr('visibility','visible');            
    }
    else if(cos_angle > 0) {
        // 0 <= angle_in_degress < 90 or 270 < angle_in_degrees < 360
        if(quantum) {
            if(sin_angle >= 0) {
                // 0 <= angle_in_degrees < 90
                d3.select('#left-red-behind').attr('visibility','visible');
            }
            else {
                // 270 < angle_in_degrees < 360
                d3.select('#right-red-behind').attr('visibility','visible');
            }
        }
        d3.select('#coin-fill-right').attr('stop-color',this.blue_shader(cos_angle-0.75*sin_angle));
        d3.select('#coin-fill-left').attr('stop-color',this.blue_shader(cos_angle+0.75*sin_angle));
        d3.select('#disk').attr('rx',cos_angle).attr('visibility','visible');
        if(quantum) {
            if(sin_angle >= 0) {
                d3.select('#right-blue').attr('transform','scale(1 1)').attr('visibility','visible');
                d3.select('#left-blue').attr('transform','scale('+cos_angle+' 1)').attr('visibility','visible');
            }
            else {
                d3.select('#left-blue').attr('transform','scale(1 1)').attr('visibility','visible');
                d3.select('#right-blue').attr('transform','scale('+cos_angle+' 1)').attr('visibility','visible');
            }
        }
    }
    else {
        // 90 <= angle_in_degrees < 270
        if(quantum) {
            if(sin_angle <= 0) {
                // 180 <= angle_in_degrees < 270
                d3.select('#left-blue-behind').attr('visibility','visible');
            }
            else {
                // 90 <= angle_in_degrees < 180
                d3.select('#right-blue-behind').attr('visibility','visible');
            }
        }
        d3.select('#coin-fill-right').attr('stop-color',this.red_shader(-cos_angle+0.75*sin_angle));
        d3.select('#coin-fill-left').attr('stop-color',this.red_shader(-cos_angle-0.75*sin_angle));
        d3.select('#disk').attr('rx',-cos_angle).attr('visibility','visible');
        if(quantum) {
            if(sin_angle <= 0) {
                d3.select('#right-red').attr('transform','scale(1 1)').attr('visibility','visible');
                d3.select('#left-red').attr('transform','scale('+(-cos_angle)+' 1)').attr('visibility','visible');
            }
            else {
                d3.select('#left-red').attr('transform','scale(1 1)').attr('visibility','visible');
                d3.select('#right-red').attr('transform','scale('+(-cos_angle)+' 1)').attr('visibility','visible');
            }
        }
    }
    // Add 3D shading to the quantum 'sphere' if it is visible.
    if(quantum) {
        d3.select('#sphere').attr('visibility','visible');
    }
    // Return the probability of measuring the red state after this update.
    if(quantum) {
        return 0.5*(1.0 - cos_angle);
    }
    else {
        return cos_angle > 0 ? 0.0 : 1.0;
    }
}

CoinApp.prototype.initialize_graph = function() {
    var graph = d3.select('#graph');
    graph.attr('height',$('#coin-box').height());
    var margins = {top: 0, right: 0, bottom: 30, left: 30};
    var width = $('#graph').width() - margins.left - margins.right;
    var height = $('#graph').height() - margins.top - margins.bottom;
    graph = graph.append('g').attr('transform','translate('+ margins.left + ',' + margins.top + ')');
    graph.append('rect')
        .attr('x',0).attr('y',0).attr('width',width).attr('height',height)
        .attr('fill','none').attr('stroke','black');
    var xc = 0.5*width,yc = 0.5*height;
    graph.append('text')
        //.attr('alignment-baseline','text-after-edge')
        .attr('x',xc).attr('y',height+margins.bottom).attr('dy','-0.5em')
        .attr('text-anchor','middle').text('Elapsed Time');
    graph.append('text')
        .attr('x',0).attr('y',yc).attr('transform','rotate(-90 ' + 0 + ' ' + yc + ')').attr('dy','-0.5em')
        .attr('text-anchor','middle').text('Measurement Probability');
    this.time_scale = d3.scale.linear().range([0,width]).domain([0,this.max_samples]);
    this.prob_scale = d3.scale.linear().range([height,0]).domain([0,1]);
    this.graph = graph;
    this.prob_data = new Array(this.max_samples);
    var bar_width = this.time_scale(1);
    graph.append('g')
        .attr('fill','red').attr('stroke','none')
        .selectAll('rect')
        .data(this.prob_data).enter()
        .append('rect')
            .attr('class','red-bar')
            .attr('x',function(d,i) { return self.time_scale(i) }).attr('width',bar_width)
            .attr('y',0).attr('height',0);
    graph.append('g')
        .attr('fill','blue').attr('stroke','none')
        .attr('transform','translate(0 ' + height + ') scale(1 -1)')
        .selectAll('rect')
        .data(this.prob_data).enter()
        .append('rect')
            .attr('class','blue-bar')
            .attr('x',function(d,i) { return self.time_scale(i) }).attr('width',bar_width)
            .attr('y',0).attr('height',0);        
}

CoinApp.prototype.update_graph = function(tick_count,red_prob,measured) {
    var self = this;
    var new_data = { 'red_prob': red_prob-0, 'measured': measured };
    // Are we scrolling yet?
    if(tick_count > this.max_samples) {
        // Drop the oldest sample if we are already displaying the maximum.
        this.prob_data.shift();
        // Add the new sample (coerced to be numeric) to the end.
        this.prob_data[this.max_samples-1] = new_data;
    }
    else {
        this.prob_data[tick_count-1] = new_data;
    }
    // Update the graph display.
    var green = $('#measure-button').css('background-color');
    this.graph.selectAll('.red-bar')
        .data(this.prob_data)
        .attr('height',function(d) {
        	if(typeof(d) === 'undefined') {
        		return 0;
        	}
        	else {
        		return self.prob_scale(1-d.red_prob);
        	}
        })
        .attr('fill',function(d) {
        	if(typeof(d) === 'undefined') {
        		return 0;
        	}
        	else if(d.measured) {
        		return green;
        	}
        	else {
        		return 'red';
        	}
        });
    this.graph.selectAll('.blue-bar')
        .data(this.prob_data)
        .attr('height',function(d) {
        	if(typeof(d) === 'undefined') {
        		return 0;
        	}
        	else {
        		return self.prob_scale(d.red_prob);
        	}
        })
        .attr('fill',function(d) {
        	if(typeof(d) === 'undefined') {
        		return 0;
        	}
        	else if(d.measured) {
        		return green;
        	}
        	else {
        		return 'blue';
        	}
        });
}

// Performs a quantum measurement by throwing a dart at the spinning sphere and updates the angle so
// that the color hit is now face on.  Adds a marker to record the random hit location and returns
// the new coin rotation angle in degrees.
CoinApp.prototype.quantum_measure = function(angle_degrees) {
    // Generate a random point in the unit circle. Note that the phi here is unrelated to
    // the rotation angle of the coin.
    var radius = Math.sqrt(Math.random());
    var phi = 2*Math.PI*Math.random();
    var x = radius*Math.cos(phi);
    var y = radius*Math.sin(phi);
    // Add this point to our hit list.
    var green = $('#measure-button').css('background-color');
    d3.select('#hits').append('circle')
        .attr('cx',x).attr('cy',y).attr('fill',green).attr('r',0.03);
    // Did we hit the dominant color that is currently visible?
    var cos_angle = Math.cos(angle_degrees*Math.PI/180.);
    var cos_sq_angle = cos_angle*cos_angle;
    if((x*cos_angle >= 0) || (x*x + cos_sq_angle*y*y < cos_sq_angle)) {
        // Set the angle to display the dominant color face on.
        return (cos_angle >= 0) ? 0.0 : 180.0;
    }
    else {
        // Set the angle to display the non-dominant color face on.
        return (cos_angle >= 0) ? 180.0 : 0.0;
    }
}

CoinApp.prototype.start_animation = function() {
    // Initialize the graph.
    this.initialize_graph();
    // Initialize the animation.
    var self = this;
    var angle_degrees = this.slider.slider('getValue')-0;
    var delta_angle_degrees = 360.0*this.frame_interval_ms/self.period_ms;
    var tick_count = 0;
    var is_quantum = ($('.model-select input:checked').val() == 'quantum');
    // Start the interval timer.
    this.interval_id = setInterval(function() {
        if(self.paused) return;
        tick_count++;
        angle_degrees += delta_angle_degrees;
        var red_prob = self.update_coin(angle_degrees,is_quantum);
        if(self.measure_next_update) {
            if(is_quantum) {
                // Perform the measurement by throwing a random dart.
                angle_degrees = self.quantum_measure(angle_degrees);
                // Redraw the coin to reflect the new measured state.
                red_prob = self.update_coin(angle_degrees,is_quantum);
            }
        }
        self.update_graph(tick_count,red_prob,self.measure_next_update);
        self.measure_next_update = false;
    },this.frame_interval_ms);
}

CoinApp.prototype.stop_animation = function() {
    clearInterval(this.interval_id);
    $('#graph').empty();
    $('#hits').empty();
}

var coin = new CoinApp();

$(document).ready(function() {

    // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    var url_params = {};
    while (match = search.exec(query)) {
        url_params[decode(match[1])] = decode(match[2]);
    }

    coin.initialize(url_params);
});
