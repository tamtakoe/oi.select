'use strict';

describe('directive: oiSelect', function() {
    var $rootScope, $compile, $timeout;

    jasmine.getJSONFixtures().fixturesPath = 'base';

    //get node text without tags
    function getNodeText(element) {
        return element.html().replace(/<.*>/, '').trim();
    }

    //open dropdown list
    function clickOn(element) {
        var event = document.createEvent('MouseEvent');
        event.initEvent('click', true, true);
        element[0].dispatchEvent(event);
        $timeout.flush();
    }

    //create oi.select element
    function createSelect(template, model) {
        return function() {
            this.scope = $rootScope.$new();
            this.scope.bundle = angular.copy(model);

            this.element = $compile(template)(this.scope);
            this.scope.$digest();

            this.selectItems = this.element.find('.select-search-list-item_selection');
        };
    }

    beforeEach(module('oi.select'));
    beforeEach(module('src/template.html'));

    beforeEach(inject(function($injector) {
        $rootScope = $injector.get('$rootScope');
        $compile   = $injector.get('$compile');
        $timeout   = $injector.get('$timeout');

        $rootScope.shopArr      = getJSONFixture('docs/data/shopArr.json');
        $rootScope.shopArrShort = getJSONFixture('docs/data/shopArrShort.json');
        $rootScope.shopObj      = getJSONFixture('docs/data/shopObj.json');
        $rootScope.shopObjShort = getJSONFixture('docs/data/shopObjShort.json');
    }));

    /* --- TESTS --- */
    describe('multiple', function() {
        var template = '<oi-select\
            oi-options="item.name for item in shopArr track by item.id"\
            ng-model="bundle"\
            multiple\
            ></oi-select>';

        var model = [{
            id: 5,
            name: 'shirt',
            category: 'clothes'
        }, {
            id: 2,
            name: 'shoes',
            category: 'shoes'
        }];

        beforeEach(createSelect(template, model));

        it('show selected items as in model bundle', function() {
            expect(this.selectItems.length).toEqual(2);
            expect(getNodeText(this.selectItems.eq(0))).toEqual('shirt');
            expect(getNodeText(this.selectItems.eq(1))).toEqual('shoes');
        });

        it('remove selected item on click', function() {
            //remove item
            this.selectItems.eq(0).triggerHandler('click');
            this.scope.$digest();

            var selectItems = this.element.find('.select-search-list-item_selection');
            expect(selectItems.length).toEqual(1);
            expect(getNodeText(selectItems.eq(0))).toEqual('shoes');
        });

        it('add item from dropdown by click', function() {
            //open dropdown
            clickOn(this.element);

            //chose item
            var dropdownItems = this.element.find('.select-dropdown-optgroup-option');
            dropdownItems.eq(2).triggerHandler('click');
            this.scope.$digest();

            var selectItems = this.element.find('.select-search-list-item_selection');
            expect(selectItems.length).toEqual(3);
            expect(getNodeText(selectItems.eq(2))).toEqual('boots');
        });
    });

    describe('single', function() {
        var template = '<oi-select\
            oi-options="item for (key, item) in shopObjShort"\
            ng-model="bundle"\
            ></oi-select>';

        var model = 'slippers';

        beforeEach(createSelect(template, model));

        it('show selected item as in model bundle', function() {
            expect(this.selectItems.length).toEqual(1);
            expect(getNodeText(this.selectItems.eq(0))).toEqual('slippers');
        });
    });
});