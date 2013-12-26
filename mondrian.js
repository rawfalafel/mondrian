/* global angular, _ */
(function() {
    'use strict';

    var app = angular.module('mondrian', ['directives']);

    app.controller('Mondrian', function($scope, $timeout) {
        // all of this configuration is defined as an array
        // but transformed into an object for useability
        var shapes = {
            // width, height
            square1: [60, 59],
            square2: [127, 128],
            square3: [266, 266],
            wide1: [83, 59],
            wide2: [127, 59],
            wide3: [176, 59],
            wide4: [220, 59],
            wide5: [176, 128],
            tall1: [59, 127],
            tall2: [83, 128],
            tall3: [83, 196],
        };

        // transform
        _.each(shapes, function(value, key, list) {
            list[key] = {
                width: value[0],
                height: value[1]
            };
        });

        var coordinates = $scope.coordinates = [
            // shape, left, top
            ['wide2', 18, 16],
            ['tall2', 18, 84],
            ['tall3', 18, 221],
            ['tall3', 18, 426],
            ['wide4', 18, 632],
            ['wide4', 155, 16],
            ['square3', 110, 83],
            ['square2', 111, 359],
            ['square2', 111, 495],
            ['wide2', 248, 358],
            ['wide2', 248, 427],
            ['wide2', 248, 495],
            ['tall1', 248, 564],
            ['tall1', 316, 564],
            ['wide3', 385, 16],
            ['wide5', 385, 84],
            ['tall2', 385, 221],
            ['tall2', 477, 221],
            ['wide3', 385, 358],
            ['wide5', 385, 426],
            ['wide5', 385, 563],
            ['wide5', 570, 16],
            ['wide5', 570, 153],
            ['wide3', 570, 290],
            ['tall2', 570, 358],
            ['tall2', 663, 358],
            ['wide5', 570, 495],
            ['wide1', 570, 632],
            ['wide1', 664, 632],
            ['square1', 756, 16],
            ['square1', 823, 16],
            ['wide2', 756, 85],
            ['wide2', 756, 153],
            ['wide2', 756, 222],
            ['wide2', 756, 290],
            ['square3', 755, 358],
            ['wide4', 756, 632],
            ['wide4', 893, 16],
            ['square2', 893, 85],
            ['square2', 893, 222],
            ['tall3', 1030, 85],
            ['tall3', 1030, 290],
            ['tall2', 1030, 496],
            ['wide2', 986, 633]
        ];

        // transform
        _.each(coordinates, function(value, key, list) {
            list[key] = {
                width: shapes[value[0]].width,
                height: shapes[value[0]].height,
                left: value[1],
                top: value[2],
                painting: null // null == empty background
            };
        });

        var paintings = [
            // url, width, height
            ['gogh.jpg', 1971, 1572],
            ['tree.jpg', 1280, 939],
            ['seurat.jpg', 2248, 1786],
            ['seurat2.jpg', 1061, 852]
        ];

        // transform
        _.each(paintings, function(value, key, list) {
            list[key] = {
                url: value[0],
                width: value[1],
                height: value[2]
            };
        });

        $scope.getStyle = function(frame) {
            return _.pick(frame, 'width', 'height', 'top', 'left');
        };

        $scope.getFrameClass = function(frame) {
            var frameClass = 'frame frame-' + coordinates.indexOf(frame) +
                ((frame.painting != null) ? ' painting-' + frame.painting : ' painting-empty');
            return frameClass;
        };

        $timeout(function() {
            _.each(paintings, function(painting, index) {
                var collection = new ContentCollection([], painting, index);
                collection.init();
                painting.collection = collection;
            });
        });

        var validPainting = function(frame) {
            // TODO: Return false for frames that are out of bounds
            if (frame.painting === null) {
                return true;
            }

            var collection = paintings[frame.painting].collection;
            if (collection.isInbounds(frame)) {
                return true;
            } else {
                return false;
            }
        };

        var rotate = $scope.rotate = function(frame, reverse) {
            // find the next useable background
            var oldpainting = frame.painting;
            do {
                if (frame.painting == null) {
                    if (!reverse) {
                        frame.painting = 0;
                    } else {
                        frame.painting = paintings.length - 1;
                    }
                } else if ((!reverse && frame.painting + 1 == paintings.length) ||
                    (reverse && frame.painting === 0)) {
                    frame.painting = null;
                } else if (reverse) {
                    frame.painting--;
                } else {
                    frame.painting++;
                }
            } while (!validPainting(frame));

            if (oldpainting == frame.painting) {
                return;
            }

            if (oldpainting != null) {
                paintings[oldpainting].collection.remove(frame);
            }
            if (frame.painting != null) {
                paintings[frame.painting].collection.add(frame);
            }
        };

        $scope.reverseRotate = function(frame) {
            rotate(frame, true);
        };

        function ContentCollection(frames, painting, paintingIndex) {
            // calculates the boundary (relative to the base div)
            // helps instantiate Content classes

            // inits scrollLeft,scrollTop for each frame
            // defines an event handler that synchronizes scroll position

            var originX = 0,
                originY = 0,
                $frames, boundary;

            function calculateBoundary() {
                var boundary = {};

                boundary.minX = _.min(frames, function(v) {
                    return v.left;
                }).left;

                boundary.maxX = (function(o) {
                    return o.left + o.width;
                })(_.max(frames, function(v) {
                    return v.left + v.width;
                }));

                boundary.minY = _.min(frames, function(v) {
                    return v.top;
                }).top;

                boundary.maxY = (function(o) {
                    return o.top + o.height;
                })(_.max(frames, function(v) {
                    return v.top + v.height;
                }));

                return boundary;
            }

            function paintingSelector() {
                return '.painting-' + paintingIndex;
            }

            function createContent(frame, boundary) {
                var content = frame.content = new Content(painting, frame, boundary);
                content.update();

                frame.content = content;

                return content;
            }

            function frameSelector(frame) {
                return '.frame.frame-' + coordinates.indexOf(frame);
            }

            var scrollHandler = function(e) {
                var scrollLeft = e.currentTarget.scrollLeft,
                    scrollTop = e.currentTarget.scrollTop;

                $frames.each(function(i, ele) {
                    ele.scrollLeft = scrollLeft;
                    ele.scrollTop = scrollTop;
                });
            };

            this.init = function() {
                boundary = calculateBoundary();
                _.each(frames, function(frame) {
                    var content = createContent(frame, boundary);

                    var $frame = $(frameSelector(frame));
                    $frame.append(content.getDiv());

                    $timeout(function() {
                        var frameDiv = $frame[0];
                        frameDiv.scrollLeft = boundary.minX;
                        frameDiv.scrollTop = boundary.minY;
                    });
                });

                $timeout(function() {
                    $frames = $(paintingSelector());
                    $frames.scroll(scrollHandler);
                });
            };

            this.isInbounds = function(frame) {
                updateOrigin();
                if (frame.left < originX) {
                    return false;
                } else if (frame.top < originY) {
                    return false;
                } else if (frame.left + frame.width > originX + painting.width) {
                    return false;
                } else if (frame.top + frame.height > originY + painting.height) {
                    return false;
                }

                return true;
            };

            var updateOrigin = this.updateOrigin = function() {
                var frameDiv = $frames[0] || {};
                originX = boundary.minX ? (boundary.minX - frameDiv.scrollLeft) : 0;
                originY = boundary.minY ? (boundary.minY - frameDiv.scrollTop) : 0;
            };

            var updateBoundary = this.updateBoundary = function() {
                boundary = calculateBoundary();

                console.log('minX', boundary.minX, ', minY', boundary.minY);
                console.log('originX', originX, ', originY', originY);

                _.each(frames, function(frame) {
                    var $frame = $(frameSelector(frame));
                    if (!frame.content) {
                        var content = createContent(frame, boundary);
                        $frame.append(content.getDiv());
                    } else {
                        frame.content.updateBoundary(boundary);
                    }

                    $timeout(function() {
                        var frameDiv = $frame[0];
                        frameDiv.scrollLeft = boundary.minX - originX;
                        frameDiv.scrollTop = boundary.minY - originY;
                    });

                });

                $timeout(function() {
                    $frames = $(paintingSelector());
                    $frames.off('scroll', scrollHandler);
                    $frames.scroll(scrollHandler);
                });
            };

            this.add = function(frame) {
                updateOrigin();

                frames = frames.concat(frame);
                $(frameSelector(frame)).scroll(scrollHandler);
                updateBoundary();
            };

            this.remove = function(frame) {
                updateOrigin();

                frames = _.without(frames, frame);
                $(frameSelector(frame)).off('scroll', scrollHandler).empty();
                frame.content = null;
                updateBoundary();
            };
        }

        function Content(painting, frame, _boundary) {
            // calculates background-position, width, and height for
            // the content within the frame
            var boundary = _boundary;

            // computes the starting point + end point of both x,y coordinates
            var $img = $('<div></div>');
            $img.css({
                'background-image': 'url(\'' + painting.url + '\')',
            });

            this.getDiv = function() {
                return $img[0];
            };

            var update = this.update = function() {
                var x1 = frame.left - boundary.minX,
                    x2 = boundary.maxX - (frame.left + frame.width),
                    y1 = frame.top - boundary.minY,
                    y2 = boundary.maxY - (frame.top + frame.height);

                $img.css({
                    'background-position-x': '-' + x1 + 'px',
                    'background-position-y': '-' + y1 + 'px',
                    width: (painting.width - x1 - x2) + 'px',
                    height: (painting.height - y1 - y2) + 'px'
                });

            };

            this.updateBoundary = function(_boundary) {
                boundary = _boundary;
                update();
            };
        }
    });
})();