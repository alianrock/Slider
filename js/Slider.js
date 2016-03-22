/**
* aouthor: alian wangzhuanglian 654849917@qq.com
* des    : Slider2.0.0 is a image slideshow plug-in for Zetop width features like touch,CSS3 transition and CSS3 transform.
*          Slider2.0.0 是一个我闲暇时间写的zepto插件，用于实现像微博、微信朋友圈展示多张图片的那种效果。可以滑动，缩放。基于JavaScript touch事件，zetop doubleTouch事件，和CSS3。
* version: 2.0.0
* depend : Zepto 1.1.3 + width 'zepto event touch ie'mode
*/


;(function($){
	'use strict';
	$.slider = function(options,callback){
		var Slider = {
			setting: {
				imgAry  : [],        //图片数组
				hasDot  : true,      //是否有点点
				isLoop  : false,     //是否有循环
				indexNow: 0,         //开始的位置
				isFullScreen: true,  //是否全屏
				$el     : null,      //最外层元素
				autoSlide: false,    //是否自动滑动
				hasCloseBtn: false   //全屏的时候是否拥有关闭全屏的按钮，默认是点击一下关闭
			},
			$el        : null,
			$close     : null,
			$ul        : null,
			$li        : null,
			$nav       : null,
			$navli     : null,
			$imgs      : null,
			liLength   : 0,
			liWidth    : 0,
			ulWidth    : 0,
			indexNow   : 0,                                  //目前的index
			winWidth   : 0,                                  //屏幕宽度
			winHeight  : 0,                                  //屏幕高度
			loadNum    : 0,                                  //加载的图片数量
			initFingerDis : 0,                               //两个手指之间的距离
			isScale       : false,                           //是否处于缩放
			isScaling     : false,                           //是否正在缩放
			isSliding     : false,                           //是否正在滑动
			initImgX      : 0,                               //图片放大的时候初始触摸的X
			initImgY      : 0,	                             //图片放大的时候初始触摸的Y
			lastImgX      : 0,                               //图片放大的时候移动的X
			lastImgY      : 0,	                             //图片放大的时候移动的Y
			imgMoveX      : 0,                               //图片最终的移动X
			imgMoveY      : 0,                               //图片最终的移动Y
			initSlideX    : 0,                               //滑动开始时手指的X坐标
			initSlideY    : 0,                               //滑动开始时手指的Y的坐标
			lastSlideY    : 0,                               //滑动进行时手指的Y坐标
			lastSlideX    : 0,                               //滑动进行时手指的X的坐标
			moveLengthX   : 0,                               //滑动的X距离
			moveLengthY   : 0,                               //滑动的Y距离
			canMove       : undefined,                       //判断是否能移动
			minScale      : 1,                               //图片最小缩放倍数
			maxScale      : 3,                               //图片最大缩放倍数
			scaleArg      : 1,                               //图片缩放率
			finalScale    : 1,                               //最终的缩放率
			scale         : 1,                               //缩放的比例
			supportOrientation: false,                       //是否支持旋转事件
			resizetTimer  : null,                            //屏幕大小变化时使用的计时器
			destoryTimer  : null,                            //tap点击关闭组件计时器
			lastTouchTime : 0,                               //记录上一次点击时间
			isDoubleTap   : false,                           //是否双击
			init: function (data, callback){
				var that = this;
				this.$el = this.setting.$el || null;
				this.supportOrientation  = (typeof window.orientation == "number" && typeof window.onorientationchage == "object");

				if(this.setting.indexNow > 0) this.indexNow = this.setting.indexNow;

				this.liLength = this.setting.imgAry.length || this.$el.find('li').length;

				//渲染
				this.render();

				//绑定事件
				this.onEvent();

				//自动滑动
				this.autoSlide();
			},
			render: function(){

				
				//根据是否全屏进行渲染
				if(this.setting.isFullScreen){
					this.fullScreenRender();
				}else{
					this.notfullScreenRender();
				}
			},
			onEvent: function(){
				var that = this;
				//滑动
				this.$el.on('touchstart ',function(e){
					that.onTouchEvent.call(that,e);
				});
				//屏幕旋转
				if(this.supportOrientation){
					$(window).on('orientationchange', function(e){
						that.uodateOrientation, call(that, e);
					}, false);
				}else{
					$(window).resize(function(e){
						that.uodateOrientation.call(that, e);
					}, false);
				}
			},
			setW_H: function(resize){
				var that = this;
				this.winWidth = $(window).width();
				this.winHeight =  $(window).height();

				this.liWidth = this.setting.isFullScreen ? this.winWidth : this.$el.width();
				this.ulWidth = this.setting.isLoop ? this.liWidth * (this.liLength + 2) : this.liWidth * this.liLength;

				this.$ul           = this.$el.find('ul').not('.slide-nav');
				this.$li           = this.$ul.find('li');
				this.$ul.css({'width' : this.ulWidth + 'px'});
				this.$li.css({'width' : this.liWidth + 'px'});

				if(this.setting.isFullScreen){
					var scrollTop = $(window).scrollTop();
					//最大化
					this.$el.css({'width' : this.winWidth,'height' : this.winHeight,'top' : scrollTop}).show();
				}
				if(resize && this.setting.isFullScreen){
					var $imgs = this.$ul.find('img');
					$imgs.each(function(i, ele){
						that.initImg($imgs.eq(i));
					});
				}
				//定位slide
				this.locUl();
			},
			//初始化全屏
			fullScreenRender: function(){
				var that = this,
					scrollTop = $(window).scrollTop();

				//插入样式
				this.appendStyle();

				//生成基本元素
				var html = '<div class="slide-wrapper" id="J-slide-wrapper">'+
								'<ul class="slide"></ul>'+
								'<span class="slide-close" id="J-slide-colse">关闭</span>'+
							'</div>';
				this.$el           = $(html);
				this.$close        = this.$el.find('#J-slide-colse');
				this.$ul           = this.$el.find('ul');

				//添加进body
				$('body').append(this.$el);

				//插入图片
				this.appendImg();

				this.setW_H();

				//插入点点
				this.appendDot();

				//显示隐藏关闭按钮
				if(!this.setting.hasCloseBtn){
					this.$close.hide();
				}

				

			},
			//初始化简单幻灯片
			notfullScreenRender: function(){
				this.setW_H();
				this.$el.addClass('slide-wrapper_n');

				if(this.setting.isLoop){
					this.$li.eq(0).before(this.$li.eq(this.liLength - 1).clone());
					this.$ul.append(this.$li.eq(0).clone());
				}

				//添加点点
				this.appendDot();

				//定位ul
				this.locUl();
			},
			imgOnload: function(e){
				this.loadNum++;
				this.initImg($(e.target))
				if(this.loadNum == this.liLength){
					//回调
					if(callback) callback();
				}
			},
			autoSlide: function(){
				var that = this;
				if(this.setting.autoSlide || !this.setting.isFullScreen){
					this.timer = setInterval(function(){
						if(!that.setting.isLoop && (that.indexNow == that.liLength - 1)){
							that.indexNow = -1;
						}
						that.movenext();
					},3000);
				}
			},
			//定位slide
			locUl: function(){
				if(this.setting.isLoop){
					this.$ul.css('left',-this.liWidth + 'px');
				}
				//根据index初始化位置
				this.transform(0, -(this.indexNow) * this.liWidth, 0, 1, 'auto', this.$ul);
			},
			appendDot: function(){
				//生成点点
				if(this.setting.hasDot){
					this.$el.append('<ul class="slide-nav"></ul>');
					this.$nav = this.$el.find('.slide-nav');

					for(var i = 0; i < this.liLength; i++){
						this.$nav.append('<li></li>');
					}

					this.$navli =  this.$nav.find('li');
					this.$navli.eq(this.indexNow).addClass('on');
				}
			},
			appendImg: function(){
				var imgHtml = '',
				    that = this;

				//生成图片列表
				for(var i = 0; i < this.liLength; i++){
					if(i == 0 && this.setting.isLoop){
						imgHtml += '<li class="Route"><span class="slide-tips">加载中...</span><img src="' + this.setting.imgAry[this.liLength - 1] + '" /></li>';
					}

					imgHtml += '<li class="Route"><span class="slide-tips">加载中...</span><img src="'+ this.setting.imgAry[i] + '" /></li>';

					if(i == this.liLength - 1 && this.setting.isLoop){
						imgHtml += '<li class="Route"><span class="slide-tips">加载中...</span><img src="' + this.setting.imgAry[0] + '" /></li>';
					}
				}
				this.$ul.append(imgHtml);
				this.$imgs = this.$ul.find('img');

				//设置img事件
				this.$imgs.on('load error emptied stalled',function(e){
					that.imgOnload.call(that,e);
				});
			},
			//初始化图片尺寸
			initImg: function($target){
				var imgHeight = $target[0].naturalHeight;
				var imgWidth  = $target[0].naturalWidth;
				if(!(imgWidth && imgHeight)){
					$target.html('<span class="slide-tips">加载失败</span>');
				}else{
					if(imgHeight > imgWidth && imgHeight > this.winWidth){
						var scaleH = this.winHeight/imgHeight;
						var scaleW = this.winWidth/imgWidth;

						if(scaleW * imgHeight > this.winHeight ){
							$target.css({'width': imgWidth * scaleH ,'height': this.winHeight});
						}else{
							$target.css({'width': this.winWidth , 'height': imgHeight * scaleW});
						}

					}else if(imgWidth >imgHeight  && imgWidth > this.winWidth){
						$target.css({'width': this.winWidth });
					}
					$target.prev().remove();
					$target.show();
				}

			},
			onTouchEvent: function(e){
				var that = this,
					type = e.type,
					touches = e.touches || [],
					$zoomTarget = this.setting.isLoop ? this.$li.eq(this.indexNow + 1) : this.$li.eq(this.indexNow),
					scale = 0;
				if (e.preventDefault && this.setting.isFullScreen) e.preventDefault();

				//关闭
				if(this.setting.hasCloseBtn){
					if($(e.target).attr('id') === 'J-slide-colse'){this.destory(); return;}
				}
				switch(type){
					case 'touchstart':
						//判断是否双击
						this.doubleTapOrNot(touches.length);

						//停止自动播放
						if(!this.isFullScreen) clearInterval(this.timer);

						//缩放
						if(touches.length === 2 && this.setting.isFullScreen){
							this.initFingerDis = this.fingersDistance(touches);
						//缩放之后的移动
						}else if(touches.length === 1 && this.isScale && !this.isSliding){
							this.initImgX = touches[0].clientX - this.imgMoveX;
							this.initImgY = touches[0].clientY - this.imgMoveY;
						//滑动的移动
						}else if(touches.length === 1 && !this.isScale){
							this.initSlideX = this.lastSlideX = touches[0].clientX;
							this.initSlideY = this.lastSlideY = touches[0].clientY;
							this.moveLength = 0;
						}

						this.$el.on('touchmove touchend', function(e){
							that.onTouchEvent.call(that,e);
						});
						break;
					case 'touchmove':
						//console.log('touchmove');

						//两只手指放大
						if(touches.length === 2 && !this.isSliding  && this.setting.isFullScreen){
								this.isScale = true;
								this.isScaling = true;
								this.lastFingerDis = this.fingersDistance(touches);
								var rate = this.lastFingerDis / this.initFingerDis;
								this.scale = rate * this.finalScale;
								this.transform(0, 0, 0, this.scale ,'50% 50%', $zoomTarget);
						//放大的时候移动图片
						}else if(touches.length === 1 && this.isScale && !this.isSliding){
								this.isScaling = true;
								this.lastImgX = touches[0].clientX;
								this.lastImgY = touches[0].clientY;
								this.imgMoveX = this.lastImgX - this.initImgX;
								this.imgMoveY = this.lastImgY - this.initImgY;

								//移动图片
								this.transform(0 ,this.imgMoveX, this.imgMoveY, this.finalScale, '50% 50%', $zoomTarget);
						//滑动
						}else if(touches.length === 1){
							this.lastSlideX = touches[0].clientX;
							this.lastSlideY = touches[0].clientY;
							this.moveLengthX = this.lastSlideX - this.initSlideX;
							this.moveLengthY = this.lastSlideY - this.initSlideY;
							console.log(this.canMove);

							if(this.canMove == undefined){
								this.canMove = (Math.abs(this.moveLengthX) >= Math.abs(this.moveLengthY));
							}
							if(this.canMove || this.setting.isFullScreen){
								this.isSliding = true;
								e.preventDefault();
								this.transform(0, (-that.indexNow * that.liWidth + that.moveLengthX), 0, 1, 'auto', this.$ul);
							}
						}

						break;
					case 'touchend':
						//console.log('touchend');

						this.$el.off('touchmove touchend');
						
						//单击关闭
						this.tapClose();

						//是否是双击
						this.doubleTap($zoomTarget);

						//滑动后重置silder位置
						this.resetSliderPosition();

						//放大后重置图片位置
						this.resetImgPosition($zoomTarget);

						//如果有自动播放，自动播放
						if(!this.isFullScreen) this.autoSlide();

						$zoomTarget = null;
						this.isSliding = false;
						this.canMove = undefined;

						break;
						
				}
			},
			tapClose: function(){
				var that = this;
				//如果只是简单的点击，且没有关闭按钮，关闭全屏
				if(this.setting.isFullScreen  && !this.setting.hasCloseBtn &&  !this.isScaling && !this.isSliding){
					clearTimeout(this.destoryTimer);
					this.destoryTimer = setTimeout(function(){
							that.destory(); 
							return;
					},250);
				}
				this.isScaling = false;
			},
			doubleTapOrNot:function(touchesLength){
				var now =  Date.now();
				var touchDelay = now - (this.lastTouchTime||now);
				this.lastTouchTime = now;
				if(touchDelay > 0 && touchDelay < 250 && touchesLength < 2){
					this.isDoubleTap = true;
				}
			},
			doubleTap: function($zoomTarget){
				if(this.isDoubleTap){
					clearTimeout(this.destoryTimer);
					// console.log(this.destoryTimer);
					if(this.isScale){
						//重置finalScale,和moveX，moveY
						this.finalScale = 1;
						this.imgMoveY = 0;
						this.imgMoveX = 0;
						this.isScale = false;
					}
					else{
						//重置finalScale,和moveX，moveY
						this.scale = this.finalScale = 1.6;
						this.imgMoveY = 0;
						this.imgMoveX = 0;
						this.isScale = true;
					}
					this.transform(3 , this.imgMoveX, this.imgMoveY, this.finalScale, '50% 50%', $zoomTarget);

					$zoomTarget = null;
					
					this.isDoubleTap = false;
				}
			},	
			resetSliderPosition: function(){
				if(!this.isSliding) return;

				var l = this.moveLengthX;
				var canMovePre =  this.indexNow != 0 || this.setting.isLoop,
					canMoveNext = this.indexNow != this.liLength - 1 || this.setting.isLoop;

				if(l < 0 && Math.abs(l) > 80 && canMoveNext){
					console.log('moveToLeft');
					this.movenext();
				}else if(l > 0 && Math.abs(l) > 80 && canMovePre){
					console.log('moveToRight');
					this.moveprev();
				}else{
					this.transform(3, -(this.indexNow) * this.liWidth, 0, 1, 'auto', this.$ul);
				}
			},
			resetImgPosition: function($zoomTarget){
				if(!this.isScale) return;
				
				
				var $img = $zoomTarget.find('img');

				//缩放倍数和状态重置
				if(this.scale <= this.minScale){
					//重置finalScale,和moveX，moveY
					this.finalScale = 1;
					this.imgMoveY = 0;
					this.imgMoveX = 0;
					this.transform(3 , 0, 0, 1, '50% 50%', $zoomTarget);
					this.isScale = false;
				}else{
					this.finalScale = this.scale;
				}

				var imgWidth = $img.width(),
					imgHeight = $img.height();


				//上下边界的界定
				var set = (this.winHeight - imgHeight)/2;
				if(set > 0){
					if(this.imgMoveY < -set){
						this.imgMoveY = -set;
					}else if(this.imgMoveY > set){
						this.imgMoveY = set;
					}
				}else{
					if(this.imgMoveY < set){
						this.imgMoveY = set;
					}else if(this.imgMoveY >　-set){
						this.imgMoveY = -set;
					}
				}

				set = (this.winWidth - imgWidth)/2;
				if(set > 0){
					if(this.imgMoveX < -set){
						this.imgMoveX = -set;
					}else if(this.imgMoveX > set){
						this.imgMoveX = set;
					}
				}else{
					if(this.imgMoveX < set){
						this.imgMoveX = set;
					}else if(this.imgMoveX > -set){
						this.imgMoveX = -set;
					}
				}

				//移动图片
				this.transform(3 ,this.imgMoveX, this.imgMoveY, this.finalScale, '50% 50%', $zoomTarget);

			},
			slide: function(){
				var that = this;

				this.movenext();

				this.timer = setTimeout(function(){
					that.slide.call(that);
				}, 2000);
			},
			moveprev: function(){
				var that = this;

				this.indexNow --;

				//移动
				this.transform(3, -(this.indexNow) * this.liWidth, 0, 1, 'auto', this.$ul);

				if(this.indexNow < 0 && this.setting.isLoop){

					this.indexNow = this.liLength - 1;

					setTimeout(function(){
						that.transform(0, -(that.indexNow) * that.liWidth, 0, 1, 'auto', that.$ul);
	 				},200);
				}

				//点点
				if(this.setting.hasDot){
					this.$navli.removeClass('on');
					this.$navli.eq(this.indexNow).addClass('on');
				}

			},
			movenext: function(){
				var that = this;

				this.indexNow ++;

				//移动
				this.transform(3, -(this.indexNow) * this.liWidth, 0, 1,  'auto', this.$ul);

				if(this.indexNow >= this.liLength && this.setting.isLoop){

					this.indexNow = 0;

					setTimeout(function(){
						that.transform( 0, 0, 0, 1, 'auto',that.$ul);
					},200);
				}

				//点点
				if(this.setting.hasDot){
					this.$navli.removeClass('on');
					this.$navli.eq(this.indexNow).addClass('on');
				}

			},
			transform : function(duration, positionX, positionY, scale, origin, $target){
				$target.css({
					'transform'         : 'translate3d(' + positionX + 'px, '+ positionY +'px, 0px) scale('+ scale +')', 
					'-webkit-transform' : 'translate3d(' + positionX + 'px, '+ positionY +'px, 0px) scale('+ scale +')',
					'transition'        : 'all 0.'+ duration +'s cubic-bezier(0.22, 0.69, 0.72, 0.88)',
					'-webkit-transition': 'all 0.'+ duration +'s cubic-bezier(0.22, 0.69, 0.72, 0.88)',
					'transform-origin'  		: origin,
					'-webkit-transform-origin'  : origin
				});
			},
			fingersDistance:function(touches){
				var e0 = touches[0] || {},
				e1 = touches[1] || {},
				x0 = e0.clientX || 0,
				x1 = e1.clientX || 0,
				y0 = e0.clientY || 0,
				y1 = e1.clientY || 0,
				disX = Math.abs(x0 - x1),
				disY = Math.abs(y0 - y1);

				return Math.sqrt(disX * disX + disY * disY);
			},
			uodateOrientation: function(){

				var that = this;

				if(this.supportOrientation){
					that.setW_H(true);
				}else{

					clearTimeout(this.resizetTimer);
					this.resizetTimer = setTimeout(function(){
						that.setW_H(true);
					}, 300);
				}
			},
			appendStyle:function(){
				if($('#J_slide-style').length <= 0){
					var $style = $('<style id="J_slide-style">.slide-wrapper li,.slide-wrapper ul{padding:0;margin:0}.slide-wrapper{overflow:hidden;margin-bottom:20px;background:rgba(0,0,0,.7);display:none;position:absolute;left:0;top:0;width:100%;height:100%}.slide-wrapper .slide{height:100%;position:absolute;left:0;top:0}.slide-wrapper li{float:left;list-style:none;width:100%;height:100%;position:relative}.slide-wrapper p{padding-left:5px;font-size:16px;line-height:20px;margin:0}.slide-wrapper img{display:block;position:absolute;left:50%;top:50%;display:none;transform-origin:50% 50%;-webkit-transform-origin:50% 50%;-ms-transform-origin:50% 50%;-moz-transform-origin:50% 50%;-o-transform-origin:50% 50%;transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);-webkit-transform:translate(-50%,-50%);-o-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%)}.slide-nav{position:absolute;left:50%;bottom:1px;transform:translateX(-50%);-ms-transform:translateX(-50%);-webkit-transform:translateX(-50%);-o-transform:translateX(-50%);-moz-transform:translateX(-50%);z-index:100;background:0 0}.slide-nav li{display:inline-block;margin:3px;border-radius:100px;opacity:.8;background:rgba(255,255,255,.6);width:5px;height:5px}.slide-nav li.on{background:rgba(255,255,255,1)}#J-slide-colse{display:block;width:15%;height:25px;color:#fff;text-align:center;line-height:25px;position:absolute;bottom:5%;right:10px;border-radius:3px;z-index:10000;border:1px solid #3079ed;background-color:#4d90fe}.slide-tips{position:absolute;top:50%;color:#fff;height:20px;width:100%;margin-top:-10px;line-height:20px;display:block;text-align:center;z-index:100}.slide-wrapper_n{overflow:hidden;position:relative}.slide-wrapper_n ul{position:absolute;left:0;top:0}.slide-wrapper_n .slide-nav{left:50%;top:auto}.slide-wrapper_n li{float:left;list-style:none}body{margin:0;padding:0}li,ul{padding:0;margin:0}.slide-wrapper{overflow:hidden;margin-bottom:20px;background:rgba(0,0,0,.7);display:none;position:absolute;left:0;top:0;width:100%;height:100%}.slide-wrapper .slide{height:100%;position:absolute;left:0;top:0}.slide-wrapper li{float:left;list-style:none;width:100%;height:100%;position:relative}.slide-wrapper p{padding-left:5px;font-size:16px;line-height:20px;margin:0}.slide-wrapper img{display:block;position:absolute;left:50%;top:50%;display:none;transform-origin:50% 50%;-webkit-transform-origin:50% 50%;-ms-transform-origin:50% 50%;-moz-transform-origin:50% 50%;-o-transform-origin:50% 50%;transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);-webkit-transform:translate(-50%,-50%);-o-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%)}.slide-nav{position:absolute;left:50%;bottom:1px;transform:translateX(-50%);-ms-transform:translateX(-50%);-webkit-transform:translateX(-50%);-o-transform:translateX(-50%);-moz-transform:translateX(-50%);z-index:100;background:0}.slide-nav li{display:inline-block;margin:3px;border-radius:100px;opacity:.8;background:rgba(255,255,255,.6);width:5px;height:5px}.slide-nav li.on{background:rgba(255,255,255,1)}#J-slide-colse{display:block;width:15%;height:25px;color:#fff;text-align:center;line-height:25px;position:absolute;bottom:5%;left:10px;border-radius:3px;z-index:10000;border:1px solid #3079ed;background-color:#4d90fe}.slide-tips{position:absolute;top:50%;color:#fff;height:20px;width:100%;margin-top:-10px;line-height:20px;display:block;text-align:center;z-index:100}</style>');
					$('head').append($style);
				}
			},
			destory:function(e){
				if(this.$close){
					this.$close.off('touchstar');
					this.$close = null;
				}
				if(this.$imgs){
					this.$imgs.off('load error emptied stalled');
					this.$imgs = null;
				}
				if(this.$el){
					this.$el.off('touchstar touchmove touchend').remove();
					this.$el = null;
				}
			}
		}


		$.extend(Slider.setting, options || {});

		Slider.init();


		return this;
	};
})(window.Zepto);
