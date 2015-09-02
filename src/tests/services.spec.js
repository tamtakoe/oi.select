'use strict';

describe('factory: oiSelectEditItem', function() {
    var oiSelectEditItem;

    beforeEach(module('oi.select')); //need angular-mocks
    beforeEach(inject(function($injector) {
        oiSelectEditItem = $injector.get('oiSelectEditItem');
    }));

    it('returns label of item', function() { //parameter name = service name
        var label = oiSelectEditItem({name: 'removedItem'}, '', function(item) {
            return item.name;
        });

        expect(label).toEqual('removedItem');
    });
});

describe('factory: oiUtils', function() {
    var oiUtils;

    beforeEach(module('oi.select')); //beforeAll
    beforeEach(inject(function($injector) {
        oiUtils = $injector.get('oiUtils');
    }));

    describe('contains', function() {
        var container = angular.element('<div><p class="someClass"><span></span></p></div>')[0];
        var contained = container.getElementsByTagName('span')[0];
        var noContained = angular.element('<span>')[0];

        it('returns true if contained is in container', function() {
            expect(oiUtils.contains(container, contained)).toEqual(true);
        });

        it('returns true if contained is in element with someClass in container', function() {
            expect(oiUtils.contains(container, contained, 'someClass')).toEqual(true);
        });

        it('returns false if contained is out of element', function() {
            expect(oiUtils.contains(container, noContained)).toEqual(false);
        });
    });

    describe('bindFocusBlur', function() {
        var $rootScope, $timeout, $document;
        var otherInputElement, element, inputElement;

        beforeAll(function() {
            document.body.innerHTML = '<input id="bie"/><p id="e"><input id="ie"/></p>';
            otherInputElement = angular.element(document.querySelector("#bie"));
            element = angular.element(document.querySelector('#e'));
            inputElement = element.find('input');
        });

        afterAll(function() {
            document.body.innerHTML = '';
        });

        beforeEach(inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            $timeout = $injector.get('$timeout');
            $document = $injector.get('$document');
        }));

        it('sets focus on element if input was focused', function() {
            spyOn(element, 'triggerHandler');
            oiUtils.bindFocusBlur(element, inputElement);

            inputElement.triggerHandler('focus');
            $timeout.flush();

            expect(element.triggerHandler).toHaveBeenCalledWith('focus');
        });

        it('sets focus on input if click was into element', function() {
            spyOn(inputElement[0], 'focus');
            oiUtils.bindFocusBlur(element, inputElement);

            var event = $document[0].createEvent('MouseEvent');
            event.initEvent('click', true, true);
            element[0].dispatchEvent(event); //element focus
            $timeout.flush();

            expect(inputElement[0].focus).toHaveBeenCalled();
        });

        it('sets blur on element if element was blurred', function() {
            spyOn(element, 'triggerHandler');
            oiUtils.bindFocusBlur(element, inputElement);

            var blur = $document[0].createEvent('Event');
            blur.initEvent('blur', false, false);

            //blur element
            element[0].dispatchEvent(blur);
            $timeout.flush();

            expect(element.triggerHandler).toHaveBeenCalledWith('blur');
        });

        it('sets blur on element if other element was focused`', function() {
            spyOn(element, 'triggerHandler');
            oiUtils.bindFocusBlur(element, inputElement);

            var click = $document[0].createEvent('MouseEvent');
            click.initEvent('click', true, true);

            var mousedown = $document[0].createEvent('MouseEvent');
            mousedown.initEvent('mousedown', true, true);

            var blur = $document[0].createEvent('Event');
            blur.initEvent('blur', false, false);

            //element focus
            element[0].dispatchEvent(click);
            $timeout.flush();

            //focus to other element
            element[0].dispatchEvent(mousedown);
            element[0].dispatchEvent(blur);
            otherInputElement[0].dispatchEvent(click);
            $timeout.flush();

            expect(element.triggerHandler).toHaveBeenCalledWith('blur');
        });

        //TODO: chose element in container with tabindex
    });

    describe('groupsIsEmpty', function() {
        it('returns true if groups is {a: [], b: [], c: []}', function() {
            expect(oiUtils.groupsIsEmpty({a: [], b: [], c: []})).toEqual(true);
        });

        it('returns false if groups is {a: [1, 2], b: []}', function() {
            expect(oiUtils.groupsIsEmpty({a: [1, 2], b: []})).toEqual(false);
        });
    });

    describe('objToArr', function () {
        it('returns [1, 2, 3] if obj is {a: 1, b: 2, c: 3, $d: 4}', function() {
            expect(oiUtils.objToArr({a: 1, b: 2, c: 3, $d: 4})).toEqual([1, 2, 3]);
        });
    });
});