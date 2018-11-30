import $ from 'anima-yocto-lite';
import indexTpl from './index.atpl';
import './index.less';

export default class Carousel {
  constructor(opts = {}) {
    const {
      element = '', // 容器，填写classname
      wrapCls = '', // 滑动显示区域，element里的第一个子元素，轮播图组件的最外层
      childrens = [], // 轮播内容数组
      autoplay = false, // 是否自动播放
      interval = 2000, // 轮播时间
      duration = 500, // 动画持续时间
      curIndex = 0, // 默认起始页
      trigger = false, // 是否有触发器
      hasTrigger = true, // 触发器是否有点击事件
      triggerCls = '', // 触发器的自定义classname
      activeTriggerCls = 'active', // 触发器激活样式
      turnDistance = 10, // 拖拽触发翻页的距离
      horizontal = true, // 轮播和拖拽方向 true(横向) false(纵向)
      callback = null, // 动画结束后调用该函数,callback(curIndex),当前页数
    } = opts;

    this.element = $(`.${element}`);
    this.wrapCls = wrapCls;
    this.childrens = childrens;
    this.autoplay = autoplay;
    this.interval = interval;
    this.duration = duration;
    this.curIndex = curIndex;
    this.trigger = trigger;
    this.hasTrigger = hasTrigger;
    this.triggerCls = triggerCls;
    this.activeTriggerCls = activeTriggerCls;
    this.turnDistance = turnDistance;
    this.horizontal = horizontal;
    this.callback = callback;

    this.init();
  }

  init() {
    // 初始化
    this._childrensLen = this.childrens.length; // 轮播个数
    this.place = 0; // panel 初始的x坐标

    this._render();

    // 长度大于1时，才有事件绑定、触控点、自动轮播等功能
    if (this._childrensLen > 1) {
      this._bindEvent();

      this._begin();
    }
  }

  // 渲染模板
  _render() {
    // 复制首尾以便循环
    if (this._childrensLen > 1) {
      this.childrens = [this.childrens[this._childrensLen - 1], ...this.childrens, this.childrens[0]]
    }
    // 拼接模板
    const contentTpl = indexTpl({
      wrapCls: this.wrapCls, // 外层样式
      childrens: this.childrens,
      trigger: (this._childrensLen > 1) && this.trigger, // 是否展示触控点
      status: this._childrensLen, // 展示几个 触控器
      activeTriggerCls: this.activeTriggerCls, // 触控器激活class
      curIndex: this.curIndex, // 当前页面
      triggerCls: this.triggerCls, // 触控器样式
      horizontal: this.horizontal, // 方向
    })

    // 渲染轮播板块
    this.element.append(contentTpl);

    // 高 默认取第一个的高度设置轮播图高度
    const panelsH = this.element.find('.caroursel-mobile-list').height();
    // 宽
    const panelsW = this.element.find('.caroursel-mobile-list').width();

    // 获取dom元素
    this.panel = this.element.find('.caroursel-mobile-content');
    this.triggers = this.element.find('.caroursel-mobile-status');
    
    // 赋值
    this.steps = panelsW; // 步长，每次滑动的距离
    if (!this.horizontal) {
      this.steps = panelsH;
    }
    if (this._childrensLen > 1) {
      this.place = -this.steps;
    }

    // 初始化样式 轮播组件
    if (this.horizontal) {
      this.panel.css({
        'width': `${panelsW * this.childrens.length}px`,
        '-webkit-transform': `translate3d(${this.place - this.curIndex * panelsW}px,0,0)`
      })
    } else {
      this.panel.css({
        'height': `${panelsH * this.childrens.length}px`,
        '-webkit-transform': `translate3d(0,${this.place - this.curIndex * panelsH}px,0)`
      })
    }
    
    this.element.find('.caroursel-mobile-wrap').height(panelsH);
    this.element.find('.caroursel-mobile-list').width(panelsW);
  }


  // 绑定事件
  _bindEvent() {
    // touch 事件
    this.panel.on('touchstart', this._start);
    this.panel.on('touchmove', this._move);
    this.panel.on('touchend', this._end);

    // 触控点的点击事件
    if (this.trigger && this.hasTrigger) {
      this.triggers.each((n, item) => {
        $(item).on('click', () => {
          this.curIndex = n;
          this._slideTo(n);
        });
      });
    }

    // 动画结束
    this.panel.on('transitionend webkitTransitionEnd', this._transitionEnd);
  }

  // 触摸开始
  _start = (e) => {
    const et = e.touches[0];
    this._movestart = false;
    // 移动距离
    this._moveDis = 0;
    // 坐标
    this._coord = {
      x: et.pageX,
      y: et.pageY,
    };
  }

  // 拖拽
  _move = (e) => {
    if (e.touches.length > 1 || e.scale && e.scale !== 1) {
      return;
    }

    const et = e.touches[0];

    // 移动距离
    let moveDis;
    if (this.horizontal) { // 左右
      moveDis = this._moveDis = et.pageX - this._coord.x;
    } else { // 上下
      moveDis = this._moveDis = et.pageY - this._coord.y;
    }

    let mCoord; // 移动时的坐标
    this._movestart = true;
    
    e.preventDefault();
    this._stop();

    mCoord = this.place - this.curIndex * this.steps + moveDis;
    this._setCoord(mCoord);
    this._moveDis = moveDis;
  }

  // 拖拽结束
  _end = (e) => {
    // 如果执行了move
    if (this._movestart) {
      let distance = this._moveDis;
      // 下一页
      if (distance < -this.turnDistance) {
        e.preventDefault();
        this._next();
      // 上一页
      } else if (distance > this.turnDistance) {
        e.preventDefault();
        this._prev();
      // 留在本页
      } else {
        this._setCoord(this.place - this.curIndex * this.steps);
      }
      distance = null;
    }
    this._movestart = false;
  }

  // 自动播放
  _begin() {
    if (this.autoplay && !this._playTimer) {
      this._stop();
      this._playTimer = setInterval(() => {
        this._next();
      }, this.interval);
    }
  }

  // 停止播放
  _stop() {
    if (this.autoplay && this._playTimer) {
      clearInterval(this._playTimer);
      this._playTimer = null;
    }
  }

  // 上一页
  _prev(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    this.curIndex = this.curIndex - 1; // 当前页面
    
    if (this.curIndex < 0) {
      this.curIndex = -1;
    }
    this._slideTo(this.curIndex);
  }

  // 下一页
  _next(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    this.curIndex = this.curIndex + 1; // 当前页面

    if (this.curIndex >= this._childrensLen) {
      this.curIndex = this._childrensLen;
    }
    this._slideTo(this.curIndex);
  }

  // 滑动
  _slideTo(curIndex, duration) {
    const scrollx = this.place - curIndex * this.steps;
    const value = duration || this.duration;
    this._setDuration(value);
    this._setCoord(scrollx);
    
    // 从最后一页到第一页
    if (curIndex === this._childrensLen) {
      this.curIndex = 0;
      clearTimeout(this.slideToForwardTime);
      this.slideToForwardTime = setTimeout(() => {
        this._setDuration(0);
        this._setCoord(this.place)
      }, this.duration)
    }

    // 从第一页到最后一页
    if (curIndex === -1) {
      this.curIndex = this._childrensLen - 1;
      clearTimeout(this.slideToBackwardTime);
      this.slideToBackwardTime = setTimeout(() => {
        this._setDuration(0);
        this._setCoord(this.place - this.curIndex * this.steps)
      }, this.duration)
    }

    // 更新触控器
    this.triggers.removeClass(this.activeTriggerCls);
    this.triggers.eq(this.curIndex).addClass(this.activeTriggerCls);

    // 回调函数
    if (this.callback) {
      this.callback(this.curIndex);
    }

    this._begin();
  }

  // 设置 translateX 值
  _setCoord(x) {
    if (this.horizontal) {
      this.panel.css('-webkit-transform', `translate3d(${x}px,0,0)`);
    } else {
      this.panel.css('-webkit-transform', `translate3d(0,${x}px,0)`);
    }
  }

  // 滑动动画时间
  _setDuration(val) {
    this.panel.css('-webkit-transition-duration', `${val}ms`)
  }

  // 动画结束
  _transitionEnd = () => {
    console.log('transitionEnd')
  }

}