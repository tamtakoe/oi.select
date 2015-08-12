'use strict';

describe('factory: oiUtils', function() {

   describe('measureString', function(){
      var parent = angular.element('<span></span>');

      beforeEach(module('oi.select'));

      it('returns 0 is str is empty', inject(function(oiUtils){ //parameter name = service name
         expect( oiUtils.measureString('',parent) ).toEqual(0);
      }));

      it('returns 21 if str is "aaa"', inject(function(oiUtils){
         expect( oiUtils.measureString('aaa',parent) ).toEqual(21);
      }))
   });

   describe('contains', function(){
      var container = angular.element('<div><p class="someClass"><span></span></p></div>')[0];
      var contained = container.getElementsByTagName('span')[0];
      var noContained = angular.element('<span>')[0];

      beforeEach(module('oi.select'));

      it('returns true if contained is in container', inject(function(oiUtils){
         expect( oiUtils.contains(container, contained) ).toEqual(true);
      }));

      it('returns true if contained is in element with someClass in container', inject(function(oiUtils){
         expect( oiUtils.contains(container, contained, 'someClass') ).toEqual(true);
      }));

      it('returns false if contained is out of element', inject(function(oiUtils){
         expect( oiUtils.contains(container, noContained) ).toEqual(false);
      }));
   })
});