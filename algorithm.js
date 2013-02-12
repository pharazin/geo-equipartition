//Map defines a module including Cluster and Point classes, on top of some setup utility functions
var Map = (function(){
    var c = function(klass){
        var construct = klass.init;
        delete klass.init;
        construct.prototype = klass;
        return construct;
    };
    return {Point: c({'init': function(x,y){
                                  this.x = x;
                                  this.y = y;
                              }
                     }),
            Cluster: c({'init': function(){
                                    this.points = [];
                                },
                        'addPoint': function(point){
                                        this.points.push(point);
                                    },
                        'hasPoints': function(){
                                         return this.points.length !== 0;
                                     },
                        'getCenterPoint': function(){
                                             var points = this.points.slice();
                                             var xbar = Map.Mean(points, function(p){return p.x;});
                                             var ybar = Map.Mean(points, function(p){return p.y;});
                                             return new Map.Point(xbar, ybar);
                                     },
                        'getNearestPoints': function(locus, metric){
                                                var pointsClone = this.points.slice();
                                                return pointsClone.sort(function(p1,p2){
                                                    var d1 = metric(locus, p1),
                                                        d2 = metric(locus, p2);
                                                    if(d1<d2) return -1;
                                                    if(d1>d2) return 1;
                                                    if(d1===d2) return 0;
                                                });
                                            },
                        'removePoint': function(point){
                                           var index = this.points.indexOf(point);
                                           if(index === -1) return false;
                                           this.points.splice(index,1);
                                           return true;
                                       }
                       }),
            makeRandomPoint: function(){
                                 return new this.Point(700*Math.random(),700*Math.random());
                             },
            makeInitialPoints: function(numberOfPoints){
                                   var unallocatedPoints = new this.Cluster();
                                   while(numberOfPoints--){
                                       unallocatedPoints.addPoint(this.makeRandomPoint());
                                   }
                                   return unallocatedPoints;
                               },
            createClusters: function(unallocatedCluster, clusterSize, metric){
                                function shedCluster(unallocatedCluster, clusterSize){
                                    var centerOfRest = null,
                                        locus = null,
                                        nearestPoints = null;

                                    var cluster = new Map.Cluster(),
                                        nextNearest = null;

                                    centerOfRest = unallocatedCluster.getCenterPoint();
                                    locus = unallocatedCluster.getNearestPoints(centerOfRest, 
                                                                                metric);
                                    locus = locus.reverse()[0];
                                    nearestPoints = unallocatedCluster.getNearestPoints(locus, 
                                                                                        metric);
                                    for(i = 0; i < clusterSize && i < nearestPoints.length; i++){
                                        nextNearest = nearestPoints[i]; 
                                        unallocatedCluster.removePoint(nextNearest);
                                        cluster.addPoint(nextNearest);
                                    }
                                    return cluster;
                                }
                                var clusters = [];
                                while(unallocatedCluster.hasPoints()){
                                    clusters.push(shedCluster(unallocatedCluster, clusterSize));
                                }
                                return clusters;
                            },
            Mean: function(array, select){
                      var i = null, 
                          value = null,
                          sum = 0;
                      for(i = 0; i < array.length; i++){
                           value = select ? select(array[i])
                                          : array[i];
                           sum += value;
                      }
                      return (sum / array.length);
                  },
            Metrics: {'Box': function(p1,p2){
                                 return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
                             },
                      'Manhattan': function(p1,p2){
                                       return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
                                   },
                      'Euclidean': function(p1,p2){
                                       return Math.sqrt(Math.pow(p1.x - p2.x, 2) 
                                                        + Math.pow(p1.y - p2.y, 2));
                                   }
                     }
            };
})();
var Page = {'drawCanvas': function(clusters, canvas){
                              canvas.width = canvas.width;
                              function drawPoint(pt, color, ctx){
                                  ctx.fillStyle = color;
                                  ctx.beginPath();
                                  var rad = 4,
                                      x = pt.x,
                                      y = pt.y,
                                      startAng = 0,
                                      endAng = 2 * Math.PI;
                                  ctx.arc(x,y,rad,startAng,endAng,true);
                                  ctx.fill();
                              }
                              function generateColor(){
                                  return 'rgb('
                                         + Math.floor(256*Math.random()) + ',' 
                                         + Math.floor(256*Math.random()) + ',' 
                                         + Math.floor(256*Math.random()) + ')';
                              }
                              var colors = ['black', 'aqua', 'yellow', 'blue', 'fuchsia', 
                                            'gray', 'green', 'lime', 'maroon', 
                                            'olive', 'purple', 'red', 
                                            'silver', 'teal', 'navy' ],
                                  ctx = canvas.getContext('2d'),
                                  i = cluster = color = points = null;
                              for(i = 0; i < clusters.length; i++){
                                  cluster = clusters[i], color = colors[i]; 
                                  //cluster = clusters[i], color = generateColor();
                                  points = cluster.points;
                                  for(j = 0; j < points.length; j++){
                                      drawPoint(points[j], color, ctx);
                           	  }
                              }
                          }
           };
//Okay, this actually generates the clusters
var numberOfPoints = 250;
var unallocatedCluster = Map.makeInitialPoints(numberOfPoints);
document.points = unallocatedCluster.points.slice();
var clusterSize = 20;
var metric = Map.Metrics.Manhattan;
var clusters = Map.createClusters(unallocatedCluster, clusterSize, metric);

//Drawing the actual clusters, for pretty display
var canvas = document.getElementById('canvas');
Page.drawCanvas(clusters, canvas);

(function(){
    document.getElementById('clusterSize').value = 20;
    document.getElementById('metric').value = 'Manhattan';
    document.getElementById('numberOfPoints').value = 250;
})();
document.getElementById('reset').addEventListener('click', function(){
    var numberOfPoints = +document.getElementById('numberOfPoints').value;
    var unallocatedCluster = Map.makeInitialPoints(numberOfPoints);
    document.points = unallocatedCluster.points.slice();
    var canvas = document.getElementById('canvas');
    Page.drawCanvas([unallocatedCluster], canvas);
});
document.getElementById('allocate').addEventListener('click', function(){
    var size = +document.getElementById('clusterSize').value,
        metric = Map.Metrics[document.getElementById('metric').value],
        unallocatedCluster = new Map.Cluster();
    unallocatedCluster.points = document.points.slice();
    var clusters = Map.createClusters(unallocatedCluster, size, metric);
    var canvas = document.getElementById('canvas');
    Page.drawCanvas(clusters, canvas);
});
