<template>
	<div>
		<div class="flex justify-between">
			<label v-if="label" :for="inputID" class="uppercase tracking-wide text-xs font-bold mb-2 pl-1">
				{{ inputID.split('_')[0] }}
				<span v-if="req && !reqHide" class="text-green-400 ml-2">*</span>
			</label>
			<span class="tracking-wide text-xs font-bold mb-2">
				<span v-if="error" class="text-orange-400">{{ typeof error === "string" ? error : '' }}</span>
				<span v-else="warning" class="text-brand-400">{{ warning }}</span>
			</span>
		</div>

		<flat-pickr
		ref="flatpickr"
		:value="value.value"
		:config="config"
		placeholder="Select date"
		name="date"
		@click.native="onClick"
		@on-change="onChange"
		@on-close="onClose"
		></flat-pickr>

		<div class="input-icon absolute top-0 right-0 flex items-center px-3"
		:class="{
		'cursor-pointer': value.length,
		'text-brand-400': value.length && !success && !error,
		'text-green-400': value.length && success,
		'text-orange-400': value.length && error,
		'pointer-events-none text-gray-300': !value.length}"
		></div>
	</div>
</template>

<script>
/*
	value = { value: [date, date], valueAsUtc: [] }
	in parent: mounted() this.$refs.dateinput.onClose([ date, date ])
*/

import flatPickr from "vue-flatpickr-component";
import ShortcutButtonsPlugin from "shortcut-buttons-flatpickr";
import { dateToUtcEpoch, convertDateToUtc } from "@/lib/datetime";

export default {
	components: {
		flatPickr
	},
	props: {
		value: {
			type: Object,
			required: true,
			validator(val) {
				return Object.prototype.hasOwnProperty.call(val, "value") && Array.isArray(val.value) && val.value.length === 2
			}
		},
		label: String,
		req: Boolean,
		reqHide: Boolean,
		range: Boolean
	},
	data() {
		return {
			success: false,
			error: "",
			warning: "",
			date: new Date(),
			config: {
				wrap: true,
				altFormat: 'M j, Y',
				// altInput: true,
				dateFormat: 'Y-m-d',
				// disable: [
				// 	(date) => date > new Date()
				// ]
				plugins: [
				  ShortcutButtonsPlugin({
				    button: [
				      { label: "Today" },
				      { label: "Week" },
				      { label: "Month" },
				      { label: "3 months" },
				      { label: "1 year" }
				    ],
				    onClick: (index) => {
				      switch (index) {
				        case 0:
				          // window.location.href = '?start=2019-12-12&end=2019-12-12'
				          break;
				        case 1:
				          // window.location.href = '?start=2019-12-06&end=2019-12-12'
				          break;
				        case 2:
				          // window.location.href = '?start=2019-11-12&end=2019-12-12'
				          break;
				        case 3:
				          // window.location.href = '?start=2019-09-12&end=2019-12-12'
				          break;
				        case 4:
				          // window.location.href = '?start=2018-12-12&end=2019-12-12'
				          break;
				      }
				    }
				  })
				]
			}
		}
	},
	watch: {
		value(val) {
			this.error = "";
		},
		// error(val) {
		// 	if (val) {
		// 		this.$refs.flatpickr.$el.classList.add("border-orange-400")
		// 	} else {
		// 		this.$refs.flatpickr.$el.classList.remove("border-orange-400")
		// 	}
		// }
	},
	created() {
		if (this.range) {
			this.config.mode = "range";
			this.config.defaultDate = [this.value.value[0], this.value.value[1]];
		} else {
			this.config.defaultDate = this.value.value;
		}

		// Use the label+component uid as the ID, and if no label supplied, use vnode tag+component uid
		const label = `${!this.label ? this.$vnode.tag : this.label.trim()}_${this._uid}`.trim();
		this.inputID = label.charAt(0).toUpperCase() + label.slice(1);
	},
	methods: {
		onClick(event) {
			this.$refs.flatpickr.$el.classList.add("border-t-2")
		},
		onChange(event) {
		},
		onClose(event) {
			this.$refs.flatpickr.$el.classList.remove("border-t-2");
			this.$refs.flatpickr.$el.blur();
			if (this.range && event.length === 1) event[1] = event[0];
			const valueAsUtc = this.range
				? event.length === 2
						? event.map(i => convertDateToUtc(i).getTime())
						: [convertDateToUtc(event[0]).getTime(), convertDateToUtc(event[0])].getTime()
				: convertDateToUtc(event).getTime();
			const value = this.range
				? (event.length === 2
					? event
					: [event[0], event[0]])
				: event;
			this.$emit("input", { value, valueAsUtc });
		}
	}
};
</script>

<style>
:root {
	--flatpickr-primary-color: #666666;
	--flatpickr-secondary-color: #e8f1fe;
};

.flatpickr-wrapper {
	position: relative;
	display: inline-block;
}
/*  .,-:::::   :::.      :::    .,:::::::::.    :::.:::::::-.    :::.    :::::::..
,;;;'````'   ;;`;;     ;;;    ;;;;''''`;;;;,  `;;; ;;,   `';,  ;;`;;   ;;;;``;;;;
[[[         ,[[ '[[,   [[[     [[cccc   [[[[[. '[[ `[[     [[ ,[[ '[[,  [[[,/[[['
$$$        c$$$cc$$$c  $$'     $$""""   $$$ "Y$c$$  $$,    $$c$$$cc$$$c $$$$$$c
`88bo,__,o, 888   888,o88oo,.__888oo,__ 888    Y88  888_,o8P' 888   888,888b "88bo,
"YUMMMMMP"YMM   ""` """"YUMMM""""YUMMMMMM     YM  MMMMP"`   YMM   ""` MMMM   "W"*/
.flatpickr-calendar {
	margin-top: .1rem;
	opacity: 0;
	display: none;
	visibility: hidden;
	-webkit-animation: none;
	animation: none;
	direction: ltr;
	border: 0;
	/*font-size: 14px;*/
	/*line-height: 24px;*/
	border-radius: 0.25rem;
	border: 1px solid var(--color-brand-500);
	position: absolute;
	width: 307.875px;
	box-sizing: border-box;
	-ms-touch-action: manipulation;
	touch-action: manipulation;
	font-family: var(--font-family);
	font-size: 80%;
}

.flatpickr-calendar.open {
	opacity: 1;
	max-height: 640px;
	visibility: visible;
}
.flatpickr-calendar.open {
	display: inline-block;
	z-index: 99999;
}
.flatpickr-calendar.animate.open {
	animation: fpFadeInDown 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.flatpickr-calendar.static {
	position: absolute;
	top: calc(100% + 2px);
}
.flatpickr-calendar.static.open {
	z-index: 999;
	display: block;
}
.flatpickr-calendar.multiMonth .flatpickr-days .dayContainer:nth-child(n+1) .flatpickr-day.inRange:nth-child(7n+7) {
	box-shadow: none !important;
}
.flatpickr-calendar.multiMonth .flatpickr-days .dayContainer:nth-child(n+2) .flatpickr-day.inRange:nth-child(7n+1) {
	-webkit-box-shadow: -2px 0 0 var(--flatpickr-secondary-color), 5px 0 0 var(--flatpickr-secondary-color);
	box-shadow: -2px 0 0 var(--flatpickr-secondary-color), 5px 0 0 var(--flatpickr-secondary-color);
}
.flatpickr-calendar .hasWeeks .dayContainer,
.flatpickr-calendar .hasTime .dayContainer {
	border-bottom: 0;
	border-bottom-right-radius: 0;
	border-bottom-left-radius: 0;
}
.flatpickr-calendar .hasWeeks .dayContainer {
	border-left: 0;
}
.flatpickr-calendar.showTimeInput.hasTime .flatpickr-time {
	height: 40px;
	border-top: 1px solid var(--flatpickr-secondary-color);
}
.flatpickr-calendar.noCalendar.hasTime .flatpickr-time {
	height: auto;
}
.flatpickr-calendar:before,
.flatpickr-calendar:after {
	position: absolute;
	display: block;
	pointer-events: none;
	border: solid transparent;
	content: '';
	height: 0;
	width: 0;
	left: 22px;
}
.flatpickr-calendar.rightMost:before,
.flatpickr-calendar.rightMost:after {
	left: auto;
	right: 22px;
}
.flatpickr-calendar:before {
	border-width: 5px;
	margin: 0 -5px;
}
.flatpickr-calendar:after {
	border-width: 4px;
	margin: 0 -4px;
}
/*.flatpickr-calendar.arrowTop { display: none; }*/
/*.flatpickr-calendar.arrowTop:before,
.flatpickr-calendar.arrowTop:after {
	bottom: 100%;
}
.flatpickr-calendar.arrowTop:before {
	border-bottom-color: var(--flatpickr-secondary-color);
}
.flatpickr-calendar.arrowTop:after {
	border-bottom-color: #fff;
}*/
.flatpickr-calendar.arrowBottom:before,
.flatpickr-calendar.arrowBottom:after {
	top: 100%;
}
.flatpickr-calendar.arrowBottom:before {
	border-top-color: var(--flatpickr-secondary-color);
}
.flatpickr-calendar.arrowBottom:after {
	border-top-color: #fff;
}
.flatpickr-calendar:focus {
	outline: 0;
}
/*.        :       ...   :::.    :::.:::::::::::: ::   .:  .::::::.
;;,.    ;;;   .;;;;;;;.`;;;;,  `;;;;;;;;;;;'''',;;   ;;,;;;`    `
[[[[, ,[[[[, ,[[     \[[,[[[[[. '[[     [[    ,[[[,,,[[['[==/[[[[,
$$$$$$$$"$$$ $$$,     $$$$$$ "Y$c$$     $$    "$$$"""$$$  '''    $
888 Y88" 888o"888,_ _,88P888    Y88     88,    888   "88o88b    dP
MMM  M'  "MMM  "YMMMMMP" MMM     YM     MMM    MMM    YMM "YMmMY"*/
.flatpickr-months {
	display: -webkit-box;
	display: -webkit-flex;
	display: -ms-flexbox;
	display: flex;
}
.flatpickr-months .flatpickr-month {
	background: transparent;
	color: rgba(0,0,0,0.9);
	fill: rgba(0,0,0,0.9);
	height: 34px;
	line-height: 1;
	text-align: center;
	position: relative;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	overflow: hidden;
	-webkit-box-flex: 1;
	-webkit-flex: 1;
	-ms-flex: 1;
	flex: 1;
}
.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month {
	text-decoration: none;
	cursor: pointer;
	position: absolute;
	top: 0;
	height: 34px;
	padding: 10px;
	z-index: 3;
	color: rgba(0,0,0,0.9);
	fill: rgba(0,0,0,0.9);
}
.flatpickr-months .flatpickr-prev-month.flatpickr-disabled,
.flatpickr-months .flatpickr-next-month.flatpickr-disabled {
	display: none;
}
.flatpickr-months .flatpickr-prev-month i,
.flatpickr-months .flatpickr-next-month i {
	position: relative;
}
.flatpickr-months .flatpickr-prev-month.flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month.flatpickr-prev-month {
/*
/*rtl:begin:ignore*/
/*
*/
left: 0;
/*
/*rtl:end:ignore*/
/*
*/
}
/*
/*rtl:begin:ignore*/
/*
/*rtl:end:ignore*/
.flatpickr-months .flatpickr-prev-month.flatpickr-next-month,
.flatpickr-months .flatpickr-next-month.flatpickr-next-month {
/*
/*rtl:begin:ignore*/
/*
*/
right: 0;
/*
/*rtl:end:ignore*/
/*
*/
}
/*
/*rtl:begin:ignore*/
/*
/*rtl:end:ignore*/
.flatpickr-months .flatpickr-prev-month:hover,
.flatpickr-months .flatpickr-next-month:hover {
	color: var(--flatpickr-primary-color);
}
.flatpickr-months .flatpickr-prev-month:hover svg,
.flatpickr-months .flatpickr-next-month:hover svg {
	fill: #f64747;
}
.flatpickr-months .flatpickr-prev-month svg,
.flatpickr-months .flatpickr-next-month svg {
	width: 14px;
	height: 14px;
}
.flatpickr-months .flatpickr-prev-month svg path,
.flatpickr-months .flatpickr-next-month svg path {
	-webkit-transition: fill 0.1s;
	transition: fill 0.1s;
	fill: inherit;
}

/*:::.    :::. ...    :::.        :   ::::::.    :::.::::::::::. ...    :::::::::::::::
`;;;;,  `;;; ;;     ;;;;;,.    ;;;  ;;;`;;;;,  `;;; `;;;```.;;;;;     ;;;;;;;;;;;''''
  [[[[[. '[[[['     [[[[[[[, ,[[[[, [[[  [[[[[. '[[  `]]nnn]]'[['     [[[     [[
  $$$ "Y$c$$$$      $$$$$$$$$$$"$$$ $$$  $$$ "Y$c$$   $$$""   $$      $$$     $$
  888    Y8888    .d888888 Y88" 888o888  888    Y88   888o    88    .d888     88,
  MMM     YM "YmmMMMM""MMM  M'  "MMMMMM  MMM     YM   YMMMb    "YmmMMMM""     MMM*/
  .numInputWrapper {
  	position: relative;
  	height: auto;
  }
  .numInputWrapper input,
  .numInputWrapper span {
  	display: inline-block;
  }
  .numInputWrapper input {
  	width: 100%;
  }
  .numInputWrapper input::-ms-clear {
  	display: none;
  }
  .numInputWrapper input::-webkit-outer-spin-button,
  .numInputWrapper input::-webkit-inner-spin-button {
  	margin: 0;
  	-webkit-appearance: none;
  }
  .numInputWrapper span {
  	position: absolute;
  	right: 0;
  	width: 14px;
  	padding: 0 4px 0 2px;
  	height: 50%;
  	line-height: 50%;
  	opacity: 0;
  	cursor: pointer;
  	box-sizing: border-box;
  }
  .numInputWrapper span:hover {
  	background: rgba(0,0,0,0.1);
  }
  .numInputWrapper span:active {
  	background: rgba(0,0,0,0.2);
  }
  .numInputWrapper span:after {
  	display: block;
  	content: "";
  	position: absolute;
  }
  .numInputWrapper span.arrowUp {
  	top: 0;
  	border-bottom: 0;
  }
  .numInputWrapper span.arrowUp:after {
  	border-left: 4px solid transparent;
  	border-right: 4px solid transparent;
  	border-bottom: 4px solid rgba(57,57,57,0.6);
  	top: 26%;
  }
  .numInputWrapper span.arrowDown {
  	top: 50%;
  }
  .numInputWrapper span.arrowDown:after {
  	border-left: 4px solid transparent;
  	border-right: 4px solid transparent;
  	border-top: 4px solid rgba(57,57,57,0.6);
  	top: 40%;
  }
  .numInputWrapper span svg {
  	width: inherit;
  	height: auto;
  }
  .numInputWrapper span svg path {
  	fill: rgba(0,0,0,0.5);
  }
  .numInputWrapper:hover {
  	background: rgba(0,0,0,0.05);
  }
  .numInputWrapper:hover span {
  	opacity: 1;
  }
/*.        :       ...   :::.    :::.:::::::::::: ::   .:       .,-:::::  ...    ::::::::::..  :::::::..
;;,.    ;;;   .;;;;;;;.`;;;;,  `;;;;;;;;;;;'''',;;   ;;,    ,;;;'````'  ;;     ;;;;;;;``;;;; ;;;;``;;;;
[[[[, ,[[[[, ,[[     \[[,[[[[[. '[[     [[    ,[[[,,,[[[    [[[        [['     [[[ [[[,/[[['  [[[,/[[['
$$$$$$$$"$$$ $$$,     $$$$$$ "Y$c$$     $$    "$$$"""$$$cccc$$$        $$      $$$ $$$$$$c    $$$$$$c
888 Y88" 888o"888,_ _,88P888    Y88     88,    888   "88o   `88bo,__,o,88    .d888 888b "88bo,888b "88bo,
MMM  M'  "MMM  "YMMMMMP" MMM     YM     MMM    MMM    YMM     "YUMMMMMP""YmmMMMM"" MMMM   "W" MMMM   "W"*/
.flatpickr-current-month {
	font-size: 135%;
	line-height: inherit;
	font-weight: 300;
	color: inherit;
	position: absolute;
	width: 75%;
	left: 12.5%;
	padding: 7.48px 0 0 0;
	line-height: 1;
	height: 34px;
	display: inline-block;
	text-align: center;
	-webkit-transform: translate3d(0px, 0px, 0px);
	transform: translate3d(0px, 0px, 0px);
}
.flatpickr-current-month span.cur-month {
	font-family: inherit;
	font-weight: 700;
	color: inherit;
	display: inline-block;
	margin-left: 0.5ch;
	padding: 0;
}
.flatpickr-current-month span.cur-month:hover {
	background: rgba(0,0,0,0.05);
}
.flatpickr-current-month .numInputWrapper {
	width: 6ch;
	width: 7ch\0;
	display: inline-block;
}
.flatpickr-current-month .numInputWrapper span.arrowUp:after {
	border-bottom-color: rgba(0,0,0,0.9);
}
.flatpickr-current-month .numInputWrapper span.arrowDown:after {
	border-top-color: rgba(0,0,0,0.9);
}
.flatpickr-current-month input.cur-year {
	background: transparent;
	-webkit-box-sizing: border-box;
	box-sizing: border-box;
	color: inherit;
	cursor: text;
	padding: 0 0 0 0.5ch;
	margin: 0;
	display: inline-block;
	font-size: inherit;
	font-family: inherit;
	font-weight: 300;
	line-height: inherit;
	height: auto;
	border: 0;
	vertical-align: initial;
	-webkit-appearance: textfield;
	-moz-appearance: textfield;
	appearance: textfield;
}
.flatpickr-current-month input.cur-year:focus {
	outline: 0;
}
.flatpickr-current-month input.cur-year[disabled],
.flatpickr-current-month input.cur-year[disabled]:hover {
	font-size: 100%;
	color: rgba(0,0,0,0.5);
	background: transparent;
	pointer-events: none;
}
.flatpickr-current-month .flatpickr-monthDropdown-months {
	appearance: menulist;
	background: transparent;
	border: none;
	box-sizing: border-box;
	color: inherit;
	cursor: pointer;
	font-size: inherit;
	font-family: inherit;
	font-weight: 300;
	height: auto;
	line-height: inherit;
	margin: -1px 0 0 0;
	outline: none;
	padding: 0 0 0 0.5ch;
	position: relative;
	vertical-align: initial;
	-webkit-box-sizing: border-box;
	-webkit-appearance: menulist;
	-moz-appearance: menulist;
	width: auto;
}
.flatpickr-current-month .flatpickr-monthDropdown-months:focus,
.flatpickr-current-month .flatpickr-monthDropdown-months:active {
	outline: none;
}
.flatpickr-current-month .flatpickr-monthDropdown-months:hover {
	background: rgba(0,0,0,0.05);
}
.flatpickr-current-month .flatpickr-monthDropdown-months .flatpickr-monthDropdown-month {
	background-color: transparent;
	outline: none;
	padding: 0;
}

/*.::    .   .:::.,:::::: .,::::::  :::  .  :::::::-.    :::.  .-:.     ::-.
';;,  ;;  ;;;' ;;;;'''' ;;;;''''  ;;; .;;,.;;,   `';,  ;;`;;  ';;.   ;;;;'
 '[[, [[, [['   [[cccc   [[cccc   [[[[[/'  `[[     [[ ,[[ '[[,  '[[,[[['
   Y$c$$$c$P    $$""""   $$""""  _$$$$,     $$,    $$c$$$cc$$$c   c$$"
    "88"888     888oo,__ 888oo,__"888"88o,  888_,o8P' 888   888,,8P"`
    "M "M"     """"YUMMM""""YUMMMMMM "MMP" MMMMP"`   YMM   ""`mM"*/
    .flatpickr-weekdays {
    	background: transparent;
    	text-align: center;
    	overflow: hidden;
    	width: 100%;
    	display: -webkit-box;
    	display: -webkit-flex;
    	display: -ms-flexbox;
    	display: flex;
    	-webkit-box-align: center;
    	-webkit-align-items: center;
    	-ms-flex-align: center;
    	align-items: center;
    	height: 28px;
    }
    .flatpickr-weekdays .flatpickr-weekdaycontainer {
    	display: -webkit-box;
    	display: -webkit-flex;
    	display: -ms-flexbox;
    	display: flex;
    	-webkit-box-flex: 1;
    	-webkit-flex: 1;
    	-ms-flex: 1;
    	flex: 1;
    }
    span.flatpickr-weekday {
    	cursor: default;
    	font-size: 90%;
    	background: transparent;
    	color: rgba(0,0,0,0.54);
    	line-height: 1;
    	margin: 0;
    	text-align: center;
    	display: block;
    	-webkit-box-flex: 1;
    	-webkit-flex: 1;
    	-ms-flex: 1;
    	flex: 1;
    	font-weight: bolder;
    }
    .dayContainer,
    .flatpickr-weeks {
    	padding: 1px 0 0 0;
    }

/*:::::::-.    :::.  .-:.     ::-.
 ;;,   `';,  ;;`;;  ';;.   ;;;;'
 `[[     [[ ,[[ '[[,  '[[,[[['
  $$,    $$c$$$cc$$$c   c$$"
  888_,o8P' 888   888,,8P"`
  MMMMP"`   YMM   ""`mM"*/
  .flatpickr-days {
  	position: relative;
  	overflow: hidden;
  	display: -webkit-box;
  	display: -webkit-flex;
  	display: -ms-flexbox;
  	display: flex;
  	-webkit-box-align: start;
  	-webkit-align-items: flex-start;
  	-ms-flex-align: start;
  	align-items: flex-start;
  	width: 307.875px;
  }
  .flatpickr-days:focus {
  	outline: 0;
  }
  .dayContainer {
  	padding: 0;
  	outline: 0;
  	text-align: left;
  	width: 307.875px;
  	min-width: 307.875px;
  	max-width: 307.875px;
  	-webkit-box-sizing: border-box;
  	box-sizing: border-box;
  	display: inline-block;
  	display: -ms-flexbox;
  	display: -webkit-box;
  	display: -webkit-flex;
  	display: flex;
  	-webkit-flex-wrap: wrap;
  	flex-wrap: wrap;
  	-ms-flex-wrap: wrap;
  	-ms-flex-pack: justify;
  	-webkit-justify-content: space-around;
  	justify-content: space-around;
  	-webkit-transform: translate3d(0px, 0px, 0px);
  	transform: translate3d(0px, 0px, 0px);
  	opacity: 1;
  }
  .dayContainer + .dayContainer {
  	-webkit-box-shadow: -1px 0 0 var(--flatpickr-secondary-color);
  	box-shadow: -1px 0 0 var(--flatpickr-secondary-color);
  }
  .flatpickr-day {
  	background: none;
  	/*border: 1px solid transparent;*/
  	box-sizing: border-box;
  	cursor: pointer;
  	font-weight: 400;
  	width: 14.2857143%;
  	-webkit-flex-basis: 14.2857143%;
  	-ms-flex-preferred-size: 14.2857143%;
  	flex-basis: 14.2857143%;
  	max-width: 39px;
  	height: 39px;
  	line-height: 39px;
  	margin: 0;
  	display: inline-block;
  	position: relative;
  	-webkit-box-pack: center;
  	-webkit-justify-content: center;
  	-ms-flex-pack: center;
  	justify-content: center;
  	text-align: center;
  }
  .flatpickr-day.inRange,
  .flatpickr-day.prevMonthDay.inRange,
  .flatpickr-day.nextMonthDay.inRange,
  .flatpickr-day.today.inRange,
  .flatpickr-day.prevMonthDay.today.inRange,
  .flatpickr-day.nextMonthDay.today.inRange,
  .flatpickr-day:hover,
  .flatpickr-day.prevMonthDay:hover,
  .flatpickr-day.nextMonthDay:hover,
  .flatpickr-day:focus,
  .flatpickr-day.prevMonthDay:focus,
  .flatpickr-day.nextMonthDay:focus {
  	cursor: pointer;
  	outline: 0;
  	background: var(--flatpickr-secondary-color);
  	border-color: var(--flatpickr-secondary-color);
  }
  .flatpickr-day.today {
  	border-color: var(--flatpickr-primary-color);
  }
  .flatpickr-day.today:hover,
  .flatpickr-day.today:focus {
  	border-color: var(--flatpickr-primary-color);
  	background: var(--flatpickr-primary-color);
  	color: #fff;
  }
  .flatpickr-day.selected,
  .flatpickr-day.startRange,
  .flatpickr-day.endRange,
  .flatpickr-day.selected.inRange,
  .flatpickr-day.startRange.inRange,
  .flatpickr-day.endRange.inRange,
  .flatpickr-day.selected:focus,
  .flatpickr-day.startRange:focus,
  .flatpickr-day.endRange:focus,
  .flatpickr-day.selected:hover,
  .flatpickr-day.startRange:hover,
  .flatpickr-day.endRange:hover,
  .flatpickr-day.selected.prevMonthDay,
  .flatpickr-day.startRange.prevMonthDay,
  .flatpickr-day.endRange.prevMonthDay,
  .flatpickr-day.selected.nextMonthDay,
  .flatpickr-day.startRange.nextMonthDay,
  .flatpickr-day.endRange.nextMonthDay {
  	font-weight: bold;
  	background: var(--flatpickr-primary-color);
  	box-shadow: none;
  	color: #fff;
  	border-color: var(--flatpickr-primary-color);
  }
  .flatpickr-day.selected.startRange + .endRange:not(:nth-child(7n+1)),
  .flatpickr-day.startRange.startRange + .endRange:not(:nth-child(7n+1)),
  .flatpickr-day.endRange.startRange + .endRange:not(:nth-child(7n+1)) {
  	box-shadow: -10px 0 0 var(--flatpickr-primary-color);
  }
  .flatpickr-day.inRange {
  	box-shadow: -5px 0 0 var(--flatpickr-secondary-color), 5px 0 0 var(--flatpickr-secondary-color);
  }
  .flatpickr-day.flatpickr-disabled,
  .flatpickr-day.flatpickr-disabled:hover,
  .flatpickr-day.prevMonthDay,
  .flatpickr-day.nextMonthDay,
  .flatpickr-day.notAllowed,
  .flatpickr-day.notAllowed.prevMonthDay,
  .flatpickr-day.notAllowed.nextMonthDay {
  	color: rgba(57,57,57,0.3);
  	background: transparent;
  	border-color: transparent;
  	cursor: default;
  }
  .flatpickr-day.flatpickr-disabled,
  .flatpickr-day.flatpickr-disabled:hover {
  	cursor: not-allowed;
  	color: rgba(57,57,57,0.1);
  }
  .flatpickr-day.week.selected {
  	box-shadow: -5px 0 0 var(--flatpickr-primary-color), 5px 0 0 var(--flatpickr-primary-color);
  }
  .flatpickr-day.hidden {
  	visibility: hidden;
  }
  .rangeMode .flatpickr-day {
  	margin-top: 1px;
  }

/*.::    .   .:::.,:::::: .,::::::  :::  .   .::    .   .::::::::::..    :::.  ::::::::::.
';;,  ;;  ;;;' ;;;;'''' ;;;;''''  ;;; .;;,.';;,  ;;  ;;;' ;;;;``;;;;   ;;`;;  `;;;```.;;;
 '[[, [[, [['   [[cccc   [[cccc   [[[[[/'   '[[, [[, [['   [[[,/[[['  ,[[ '[[, `]]nnn]]'
   Y$c$$$c$P    $$""""   $$""""  _$$$$,cccc   Y$c$$$c$P    $$$$$$c   c$$$cc$$$c $$$""
    "88"888     888oo,__ 888oo,__"888"88o,     "88"888     888b "88bo,888   888,888o
    "M "M"     """"YUMMM""""YUMMMMMM "MMP"     "M "M"     MMMM   "W" YMM   ""` YMMMb*/
    .flatpickr-weekwrapper {
    	float: left;
    }
    .flatpickr-weekwrapper .flatpickr-weeks {
    	padding: 0 12px;
    	box-shadow: 1px 0 0 var(--flatpickr-secondary-color);
    }
    .flatpickr-weekwrapper .flatpickr-weekday {
    	float: none;
    	width: 100%;
    	line-height: 28px;
    }
    .flatpickr-weekwrapper span.flatpickr-day,
    .flatpickr-weekwrapper span.flatpickr-day:hover {
    	display: block;
    	width: 100%;
    	max-width: none;
    	color: rgba(57,57,57,0.3);
    	background: transparent;
    	cursor: default;
    	border: none;
    }



    .flatpickr-innerContainer {
    	display: block;
    	display: -webkit-box;
    	display: -webkit-flex;
    	display: -ms-flexbox;
    	display: flex;
    	box-sizing: border-box;
    	overflow: hidden;
    }
    .flatpickr-rContainer {
    	display: inline-block;
    	padding: 0;
    	box-sizing: border-box;
    }

    @-webkit-keyframes fpFadeInDown {
    	from {
    		opacity: 0;
    		transform: translate3d(0, -20px, 0);
    	}
    	to {
    		opacity: 1;
    		transform: translate3d(0, 0, 0);
    	}
    }
    @keyframes fpFadeInDown {
    	from {
    		opacity: 0;
    		transform: translate3d(0, -20px, 0);
    	}
    	to {
    		opacity: 1;
    		transform: translate3d(0, 0, 0);
    	}
    }


    .flatpickr-input {
    	@apply font-sans p-4 mb-3 border border-gray-400 block rounded leading-tight bg-white text-gray-900 appearance-none	 w-full
    }
    .flatpickr-input:hover {
    	@apply border-brand-500
    }
    .flatpickr-input:focus {
    	@apply outline-none shadow-lg border-brand-500 border-t-2
    }

    .flatpickr-calendar {
    	@apply p-0 text-center shadow-lg bg-white
    }
    </style>
