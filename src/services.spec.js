'use strict';

describe('factory: oiSelectEditItem', function() {
   var oiSelectEditItem;

   beforeEach(module('oi.select')); //need angular-mocks
   beforeEach(inject(function($injector) {
      oiSelectEditItem = $injector.get('oiSelectEditItem');
   }));

   it('returns label of item', function(){ //parameter name = service name
      var label = oiSelectEditItem({name: 'removedItem'}, '', function(item) {
         return item.name;
      });

      expect(label).toEqual('removedItem');
   });
});

describe('factory: oiUtils', function() {
   var oiUtils;

   beforeEach(module('oi.select'));
   beforeEach(inject(function($injector) {
      oiUtils = $injector.get('oiUtils');
   }));

   describe('measureString', function(){
      var parent = angular.element('<span></span>');

      it('returns 0 if str is empty', function(){
         expect( oiUtils.measureString('', parent) ).toEqual(0);
      });

      it('returns positive number if str exist', function(){
         expect(oiUtils.measureString('a', parent) > 0).toEqual(true);
      });

      it('returns "a" width * 3 if str contains "aaa"', function(){
         var aWidth = oiUtils.measureString('a', parent);
         expect( oiUtils.measureString('aaa', parent) ).toEqual(aWidth * 3);
      });
   });

   describe('contains', function(){
      var container = angular.element('<div><p class="someClass"><span></span></p></div>')[0];
      var contained = container.getElementsByTagName('span')[0];
      var noContained = angular.element('<span>')[0];

      it('returns true if contained is in container', function(){
         expect( oiUtils.contains(container, contained) ).toEqual(true);
      });

      it('returns true if contained is in element with someClass in container', function(){
         expect( oiUtils.contains(container, contained, 'someClass') ).toEqual(true);
      });

      it('returns false if contained is out of element', function(){
         expect( oiUtils.contains(container, noContained) ).toEqual(false);
      });
   })
});