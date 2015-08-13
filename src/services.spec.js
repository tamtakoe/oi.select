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

   beforeEach(module('oi.select')); //beforeAll
   beforeEach(inject(function($injector) {
      oiUtils = $injector.get('oiUtils');
   }));

   describe('measureString', function(){
      var parent = angular.element('<span></span>');

      it('returns 0 if str is empty', function(){
         expect( oiUtils.measureString('', parent) ).toEqual(0);
      });

      it('returns positive number if str exist', function(){
         expect( oiUtils.measureString('a', parent) > 0 ).toEqual(true);
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
   });

   describe('bindFocusBlur', function(){
      var container = angular.element('<div><input id="bie"/><p id="e"><input id="ie"/></p></div>')[0];

      var beforeInputElement = angular.element(container.querySelector("#bi"));
      var element            = angular.element(container.querySelector('#e'));
      var inputElement       = angular.element(container.querySelector('#ie'));

      it('sets focus on element if input was focused', function(){
         oiUtils.bindFocusBlur(element, inputElement);

         var angularElement = angular.element; //save previous function

         angular.element = jasmine.createSpy("angular.element").and.callFake(function(){
            return element;
         });

         spyOn(element, 'triggerHandler');
         //element.triggerHandler('focus'); //work
         inputElement[0].focus(); //doesn't work

         angular.element = angularElement; //restore
         expect(element.triggerHandler).toHaveBeenCalledWith('focus'); // Expected spy trigger to have been called
      });
   });
});