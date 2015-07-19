'use strict';

describe('factory: oiUtils', function() {
   describe('when I call oiUtils.isEqual', function(){
      beforeEach(module('oi.select'));
      it('returns true', inject(function(oiUtils){ //parameter name = service name
         expect( oiUtils.isEqual(1,1) ).toEqual(true);
      }))
   })
});