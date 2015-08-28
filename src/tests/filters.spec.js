'use strict';

describe('filter: none', function() {
    var $filter, noneFilter;

    beforeEach(module('oi.select'));
    beforeEach(inject(function($injector) {
        $filter = $injector.get('$filter');
        noneFilter = $injector.get('noneFilter');
    }));

    it('has a none filter', function() {
        expect($filter('none')).toBeDefined();
    });

    it('returns value', function() {
        expect(noneFilter('test')).toEqual('test');
    });
});

describe('filter: oiSelectCloseIcon', function() {
    var $filter, oiSelectCloseIconFilter;

    beforeEach(module('oi.select'));
    beforeEach(inject(function($injector) {
        $filter = $injector.get('$filter');
        oiSelectCloseIconFilter = $injector.get('oiSelectCloseIconFilter');
    }));

    it('has a oiSelectCloseIcon filter', function() {
        expect($filter('oiSelectCloseIcon')).toBeDefined();
    });

    it('returns item with close icon', function() {
        var label = oiSelectCloseIconFilter('test').$$unwrapTrustedValue();

        expect(label).toEqual('test<span class="close select-search-list-item_selection-remove">×</span>');
    });
});