```html
<!DOCTYPE html>
<html>
<head>
	<title></title>
  <meta name="viewport" content="maximum-scale=1.0,minimum-scale=1.0,user-scalable=0,width=device-width,initial-scale=1.0"/>
</head>
<body>
	<div class="J-wrap"></div>
</body>
</html>
```

```css
.main {
  height: 100px;
  background: #bbb;
}
```

```js
import Carousel from '../index';
new Carousel({
  element: 'J-wrap',
  childrens: ['<div class="main">111</div>','<div class="main">222</div>'],
  trigger: true,
});
```