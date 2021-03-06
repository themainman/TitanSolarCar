var ampdraw = 0;
//used to compare so we don't animate for repeat values
var oldvoltage = 1;
var voltage = 0;
//used to compare so we don't animate for repeat values
var oldAux = 1;
var auxVolt = 0;
//used to compare so we don't animate for repeat values
var oldCharge = 1;
var charge = 0;
var chargeInt = 0;

//used to compare so we don't animate for repeat values
var oldangle = 1;
var angle = 0;

//used to compare so we don't animate for repeat values
var oldmph = 1;
var mph = 0;

//this defines the socket we are writing to and reading from
var socket = io();


function init() { // This is the function the browser first runs when it's loaded.

  //BATTERY MONITOR
  socket.on('bmv', function(data) {
    ampdraw = data.I;
    oldvoltage = voltage; // Non-Repeating Data
    voltage = data.V;
    oldAux = auxVolt; // Non-Repeating Data
    auxVolt = data.VS;
    oldCharge = charge; // Non-Repeating Data
    charge = data.TTG;
    chargeInt = parseInt(charge);
    if (voltage != oldvoltage) { // Non-Repeating Data
      $('#mainV').html('Main V: ' + voltage);
    }
    if (auxVolt != oldAux) { // Non-Repeating Data
      $('#auxV').html('Aux V: ' + auxVolt);
    }
    if (charge != oldCharge) { // Non-Repeating Data
      $('#time').html('<a class="left">T:</a>' + Math.floor(chargeInt / 60) + ":" + (chargeInt - (Math.floor(chargeInt / 60) * 60)) + ".0"); // Original value is in minutes, parses to be in HH:MM:SS
    }
  });
  //POTENTIOMETER (Rotates the wheels)
  socket.on('pot', function(data) {
    oldangle = angle; // Non-Repeating Data
    angle = data;
    angleNo = parseInt(angle) + 65.0;
    // CHANGES THE COLOR OF THE WHEELS BASED ON THE ANGLE
    // INCLUDES SOME HECKIN F U N MATHS
    if (angleNo < 45) {
      g = Math.floor(255 * angleNo / 45);
      r = 255;
    } else {
      if (angleNo < 65) {
        r = Math.floor(255 * (-1 * (angleNo - 65)) / 20);
        g = 255;
      } else {
        if (angleNo < 85) {
          r = Math.floor(255 * ((angleNo - 65)) / 20);
          g = 255;
        } else {
          g = Math.ceil(255 * ((-1 * (angleNo - 130)) / 45));
          r = 255;
        }
      }
    }
    var colorVar = "rgb(" + r + "," + g + "," + 0 + ")";
    if (angle != oldangle) { //Non-Repeating Data
      var rotate = 'rotate(' + angle + 'deg)';
      $('#wheelOne').css({
        'transform': 'translateY(-40%)' + rotate,
        'background-color': colorVar
      });
      $('#wheelTwo').css({
        'transform': 'translateY(-40%)' + rotate,
        'background-color': colorVar
      });
    }
  });

  //WE NEED SPEED !!!
  socket.on('mph', function(data) {
    oldmph = mph;
    mph = data;
    if (mph != oldmph) {
      $('#speed').html(mph);
    }
  });
}

//Highcharts
$(document).ready(function() {
  var helloWorld = $('#container').html();
  Highcharts.setOptions({
    colors: ['#3d3d3d'],
    global: {
      useUTC: true
    }
  });

  Highcharts.chart('container', {
    chart: { //Customization for Highcharts
      backgroundColor: '#cecece',
      plotBackgroundColor: '#cecece',
      type: 'line',
      animation: Highcharts.svg,
      // don't animate in old IE
      marginRight: 4,
      events: {
        load: function() {
          var series = this.series[0];
          setInterval(function() {
            var x = (new Date()).getTime(), // current time
              y = ampdraw * -1; // INPUT VALUE !!!
          }, 1000);

          setInterval(function() {
            var x = (new Date()).getTime(),
              y = ampdraw * -1; // INPUT VALUE !!!
            series.addPoint([x, y], true, true);
          }, 1000);

        }
      }
    },
    // FORMAT OPTIONS
    plotOptions: {
      series: {
        enableMouseTracking: false,
        marker: {
          enabled: false
        }
      },
      line: {
        linecap: 'square',
      }
    },
    credits: {
      enabled: false
    },
    title: {
      text: 'Amp Draw (-mA)'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 500
    },
    yAxis: {
      title: {
        text: ''
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    },
    tooltip: {
      formatter: function() {
        return '<b>' + this.series.name + '</b><br/>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' + Highcharts.numberFormat(this.y, 2);
      }
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Amp Draw',
      data: (function() {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -19; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });
});
//variables for left turn signal
var leftOn = 0;
var leftColor = 1;
var leftChange;

//left turn signal trigger / flashing
function tsl() {
  if (rightOn != 1 && bothOn != 1) {
    if (leftOn == 0) {
      $('#left').css('border-color', 'transparent #ffd55b transparent transparent');
      leftChange = setInterval(function() {
        if (leftColor == 0) {
          $('#left').css('border-color', 'transparent #ffd55b transparent transparent');
          leftColor = 1;
          socket.emit('leftSignal', leftColor);
        } else if (leftColor == 1) {
          $('#left').css('border-color', 'transparent #ffbf00 transparent transparent');
          leftColor = 0;
          socket.emit('leftSignal', leftColor);
        }
      }, 500);
      leftOn = 1;
    } else if (leftOn == 1) {
      clearInterval(leftChange); //Stop
      $('#left').css('border-color', 'transparent #ffbf00 transparent transparent');
      leftColor = 0;
      socket.emit('leftSignal', leftColor);
      leftOn = 0;
    }
  }
}

//variables for right turn signal
var rightOn = 0;
var rightColor = 1;
var rightChange;

//right turn signal triggers / flashing
function tsr() {
  if (leftOn != 1 && bothOn != 1) {
    if (rightOn == 0) {
      socket.emit('rightSignal', rightOn);
      $('#right').css('border-color', 'transparent transparent transparent #ffd55b');
      rightChange = setInterval(function() {
        if (rightColor == 0) {
          $('#right').css('border-color', 'transparent transparent transparent  #ffd55b');
          rightColor = 1;
        } else if (rightColor == 1) {
          $('#right').css('border-color', 'transparent transparent transparent #ffbf00');
          rightColor = 0;
        }
      }, 500);
      rightOn = 1;
    } else if (rightOn == 1) {
      clearInterval(rightChange); //Stop
      $('#right').css('border-color', 'transparent transparent transparent #ffbf00');
      socket.emit('rightSignal', rightOn);
      rightOn = 0;
    }
  }
}

//variable for hazards
var bothOn = 0;
var bothColor = 1;
var bothChange;

//triggers for hazards
function tsh() {
  if (bothOn == 0) {
    clearInterval(rightChange);
    clearInterval(leftChange);
    socket.emit('bothSignal', bothOn);
    $('#right').css('border-color', 'transparent transparent transparent #ffd55b');
    $('#left').css('border-color', 'transparent #ffd55b transparent transparent');
    bothChange = setInterval(function() {
      if (bothColor == 0) {
        $('#right').css('border-color', 'transparent transparent transparent  #ffd55b');
        $('#left').css('border-color', 'transparent #ffd55b transparent transparent');
        bothColor = 1;
      } else if (bothColor == 1) {
        $('#right').css('border-color', 'transparent transparent transparent #ffbf00');
        $('#left').css('border-color', 'transparent #ffbf00 transparent transparent');
        bothColor = 0;
      }
    }, 500);
    bothOn = 1;
  } else if (bothOn == 1) {
    clearInterval(bothChange); //Stop
    $('#right').css('border-color', 'transparent transparent transparent #ffbf00');
    $('#left').css('border-color', 'transparent #ffbf00 transparent transparent');
    socket.emit('bothSignal', bothOn);
    bothOn = 0;
  }
}
