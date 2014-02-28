"use strict";

/**
 * Global `fabricator` object
 * @namespace
 */
var fabricator = window.fabricator = {};


/**
 * Default options
 * @type {Object}
 */
fabricator.options = {
	toggles: {
		preview: true,
		code: false
	}
};


// create storage object if it doesn't exist; store options
localStorage.fabricator = localStorage.fabricator || JSON.stringify(fabricator.options);


/**
 * Cache DOM
 * @type {Object}
 */
fabricator.dom = {
	primaryMenu: document.querySelector(".f-menu"),
	menuItems: document.querySelectorAll(".f-menu li a"),
	menuToggle: document.querySelector(".f-menu-toggle"),
	prototype: document.getElementById("prototype")
};


/**
 * AJAX call for JSON
 * @param  {Function} callback
 * @return {Object} fabricator
 */
fabricator.getData = function (callback) {

	var url = "assets/json/data.json",
		data;

	// get data
	var getData = new XMLHttpRequest();
	getData.open("GET", url, false);
	getData.send();

	data = JSON.parse(getData.responseText);

	// send data to callback
	if (typeof callback === "function") {
		callback(data);
	}

	return this;

};


/**
 * Build color chips
 */
fabricator.buildColorChips = function () {

	var chips = document.querySelectorAll(".f-color-chip"),
		color;

	for (var i = chips.length - 1; i >= 0; i--) {
		color = chips[i].querySelector(".f-color-chip__color").innerHTML;
		chips[i].style.borderTopColor = color;
	}

	return this;

};


/**
 * Add `f-active` class to active menu item
 */
fabricator.setActiveItem = function () {

	/**
	 * @return {Array} Sorted array of menu item "ids"
	 */
	var parsedItems = function () {

		var items = [],
			id, href;

		for (var i = fabricator.dom.menuItems.length - 1; i >= 0; i--) {

			// remove active class from items
			fabricator.dom.menuItems[i].classList.remove("f-active");

			// get item href
			href = fabricator.dom.menuItems[i].getAttribute("href");

			// get id
			if (href.indexOf("#") > -1) {
				id = href.split("#").pop();
			} else {
				id = href.split("/").pop().replace(/\.[^/.]+$/, "");
			}

			items.push(id);

		}

		return items.reverse();

	};


	/**
	 * Match the "id" in the window location with the menu item, set menu item as active
	 */
	var setActive = function () {

		var href = window.location.href,
			items = parsedItems(),
			id, index;

		// get window "id"
		if (href.indexOf("#") > -1) {
			id = window.location.hash.replace("#", "");
		} else {
			id = window.location.pathname.split("/").pop().replace(/\.[^/.]+$/, "");
		}

		// find the window id in the items array
		index = (items.indexOf(id) > -1) ? items.indexOf(id) : 0;

		// set the matched item as active
		fabricator.dom.menuItems[index].classList.add("f-active");

	};

	window.addEventListener("hashchange", setActive);

	setActive();

	return this;

};


/**
 * Inject prototype content into page
 * @param  {String} id prototype identifier
 * @return {Object} fabricator
 */
fabricator.templatePrototype = function (id) {

	var content;

	// get data
	this.getData(function (data) {
		for (var i = data.prototypes.length - 1; i >= 0; i--) {
			if (data.prototypes[i].id === id) {
				content = data.prototypes[i].content;
				fabricator.dom.prototype.innerHTML = content;
			}
		}

	});

	return this;

};


/**
 * Toggle handlers
 * @type {Object}
 */
fabricator.toggles = {};

/**
 * Click handler to primary menu toggle
 * @return {Object} fabricator
 */
fabricator.toggles.primaryMenu = function () {

	// shortcut menu DOM
	var toggle = fabricator.dom.menuToggle;

	// toggle classes on certain elements
	var toggleClasses = function () {
		document.querySelector("html").classList.toggle("state--menu-active");
		fabricator.dom.menuToggle.classList.toggle("f-icon-menu");
		fabricator.dom.menuToggle.classList.toggle("f-icon-close");
	};

	// toggle classes on click
	toggle.addEventListener("click", function () {
		toggleClasses();
	});

	// close menu when clicking on item (for collapsed menu view)
	var closeMenu = function () {
			toggleClasses();
		};

	for (var i = 0; i < fabricator.dom.menuItems.length; i++) {
		fabricator.dom.menuItems[i].addEventListener("click", closeMenu);
	}

	return this;

};

/**
 * Handler for preview and code toggles
 * @return {Object} fabricator
 */
fabricator.toggles.itemData = function () {

	var items = document.querySelectorAll(".f-item-group"),
		itemToggleSingle = document.querySelectorAll(".f-toggle"),
		controls = document.querySelector(".f-controls"),
		itemToggleAll = controls.querySelectorAll("[data-toggle]"),
		options = JSON.parse(localStorage.fabricator);


	// toggle single
	var toggleSingleItem = function () {
		var group = this.parentNode.parentNode.parentNode,
			toggle = this.attributes["data-toggle"].value;

		group.classList.toggle("f-item-" + toggle + "-active");
	};

	for (var i = 0; i < itemToggleSingle.length; i++) {
		itemToggleSingle[i].addEventListener("click", toggleSingleItem);
	}


	// toggle all
	var toggleAllItems = function (type, value) {

		var button = document.querySelector(".f-controls [data-toggle=" + type + "]");

		for (var i = 0; i < items.length; i++) {
			if (value) {
				items[i].classList.add("f-item-" + type + "-active");
			} else {
				items[i].classList.remove("f-item-" + type + "-active");
			}
		}

		// toggle styles
		if (value) {
			button.classList.add("f-active");
		} else {
			button.classList.remove("f-active");
		}

		// update options
		options.toggles[type] = value;
		localStorage.setItem("fabricator", JSON.stringify(options));

	};

	for (var ii = 0; ii < itemToggleAll.length; ii++) {

		itemToggleAll[ii].addEventListener("click", function (e) {

			// extract info from target node
			var type = e.target.getAttribute("data-toggle"),
				value = e.target.className.indexOf("f-active") < 0;

			// toggle the items
			toggleAllItems(type, value);

		});

	}

	// persist toggle options from page to page
	for (var toggle in options.toggles) {
		if (options.toggles.hasOwnProperty(toggle)) {
			toggleAllItems(toggle, options.toggles[toggle]);
		}
	}

	return this;

};


////////////////////////////////////////////////////////
// Init
////////////////////////////////////////////////////////
(function () {

	// attach toggle handlers
	fabricator.toggles
		.primaryMenu()
		.itemData();

	fabricator.buildColorChips()
		.setActiveItem();

	// if prototype page, template accordingly
	if (fabricator.dom.prototype && location.hash) {
		fabricator.templatePrototype(location.hash.replace(/#/, ""));
	}

	// syntax highlighting
	Prism.highlightAll();

}());