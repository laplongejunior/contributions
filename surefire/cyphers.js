(function(global){
	"use strict";
	
	// Utility method
	const showError = function(msg) {
		console.error(msg);
		return null;
	};
	
	// ALPHA is month-based
	const MONTHS = {
		JANUARY: 1,
		FEBRUARY: 2,
		MARCH: 3,
		APRIL: 4,
		MAY: 5,
		JUNE: 6,
		JULY: 7,
		AUGUST: 8,
		SEPTEMBER: 9,
		OCTOBER: 10,
		NOVEMBER: 11,
		DECEMBER: 12
	};
	Object.freeze(MONTHS);
	
	// Used by both BETA and DELTA
	const polybiusIn = function(pos,indexes) {
		return [indexes[Math.floor(pos/indexes.length)],indexes[pos%indexes.length]];
	};
	const polybiusOut = function(x,y,indexes) {
		return indexes.indexOf(x)*indexes.length+indexes.indexOf(y);
	};
	
	// Read every N group of characters
	// This method either NULL or a valid answer for the Surefire cyphers when case-insenstive
	//
	// Lower-case and upper-case letters are transmitted to the cypher as lower-case letters
	// Numbers may or may not be handled depending on the cypher
	// Other characters (for example, spaces) are skipped and returned as is
	// A skipped character can't appear when a block is in progress
	// If the first letter in a block is Upper-case, said block's output has a reverted case
	//
	// (Surefire cyphers are case-insensitive, so returning upper-case inputs as the reversed-case of a lower-case input is intuitive)
	const process = function(input, allowNumbers, handler, blockSize=1) {
		if (blockSize < 0) return showError("Default block size is 1, received "+blockSize);
		if (blockSize === 0) blockSize = input.length;
		
		const err = function(msg) { return showError("'"+input+"', size " +blockSize+" failed: "+msg); };
		
		// Result holds a list of each block : the characters returned by the cypher and a value to convert the case later
		let chain = [];
		let currentBlock = null;
		
		// Allows to find the first unsolved block in the chain
		let lastIndex = 0;
		const findNextEmptyBlock = function() {
			for (let i = lastIndex; i < chain.length; ++i) {
				let temp = chain[i];
				if (temp.data === null) return temp;
			}
			return undefined;
		};		
		
		for (let i = 0; i < input.length; ++i) {			
			let chara = input.charAt(i);
			let code = chara.charCodeAt(0);
			
			// Case is stored this way : TRUE for UpperCase, FALSE for LowerCase, NULL for numbers and illegal characters
			let currentCase;
			if (code >= 65 && code <= 90) currentCase = true;
			else if (code >= 97 && code <= 122) currentCase = false;
			else currentCase = null;
			
			if (currentCase === null && (!allowNumbers || code < 48 || code > 57)) {
				if (currentBlock !== null) // No way to know where to place the character
					return err("Skipped character encountered in a in-progress character block");
				chain.push({data:chara,inverted:null});
				continue;
			}
			if (currentBlock === null) {
				chain.push(currentBlock = {data:"",inverted:null});
			}
			
			// Store the block as lower case, no matter the output
			if (currentCase) chara = String.fromCharCode(code+=32);
			currentBlock.data += chara;
			// First letter in the block decides the case of the block
			if (currentBlock.inverted === null)
				currentBlock.inverted = currentCase;
			
			if (currentBlock.data.length !== blockSize) continue;	
			
			let answers = handler(currentBlock.data);
			currentBlock.data = null;
			currentBlock = null;
			
			if (!Array.isArray(answers)) answers = [answers];		
			for (let answer of answers)
				findNextEmptyBlock().data=answer;
		}
		if (currentBlock != null)
			return err("Uncomplete character block at the end");
		
		let result = "";
		for (let block of chain) {
			for (let chara of block.data) {
				if (block.inverted) { // NULL is falsy, so case is respected if the block is only made of numbers
					let code = chara.charCodeAt(0);
					if (code >= 65 && code <= 90) code+=32;
					else if (code >= 97 && code <= 122) code-=32;
					chara = String.fromCharCode(code);
				}
				result += chara;
			}
		}
		return result;
	};
	
	let SUREFIRE = {
		alpha : function(month){
			if (month < 1 || month > 12) return showError("Month #"+month+" is not in a traditional calendar");
			if (month === 1) month = 13;
			const SHIFT = month;
			
			return {
				cypher : function(input) {
					return process(input, false, function(str){
						let code = str.charCodeAt(0)+SHIFT;
						if (code > 122) code -= 26;
						return String.fromCharCode(code);
					}, 1);
				},
				decypher : function(input) {
					return process(input, false, function(str){
						let code = str.charCodeAt(0)-SHIFT;
						if (code < 97) code += 26;
						return String.fromCharCode(code);
					}, 1);
				}, id : "23697"
			};
		}, beta : function(){
			const VOWELS = ['a','e','i','o','u','y'];
			return {
				cypher : function(input) {
					return process(input, true, function(str){
						let pos = str.charCodeAt(0);
						if (pos >= 97 && pos <= 122) pos-=97;
						else if (pos === 48) pos=35; // '0'
						else pos-=23; //49+pos-26
						pos = polybiusIn(pos,VOWELS);
						return pos[0]+''+pos[1];
					}, 1);
				},
				decypher : function(input) {				
					return process(input, false, function(str){
						let pos = polybiusOut(str.charAt(0),str.charAt(1),VOWELS);
						if (pos < 26) pos+=97;
						else if (pos === 35) pos=48; // '0'
						else pos+=23; //49+pos-26
						return String.fromCharCode(pos);
					}, 2);
				}, id : "22147"
			};
		}, delta : function(){	
			const NUMBERS = ['1','2','3','4','5'];
			const pIn = function(str) {
				let pos = str.charCodeAt(0)-97;
				if (pos > 9) pos--;
				return polybiusIn(pos,NUMBERS);
			};
			const pOut = function(x,y) {
				let pos = polybiusOut(x,y,NUMBERS);
				if (pos > 9) pos++;
				return String.fromCharCode(pos+97);
			};
			
			return {
				cypher : function(input) {
					let queue = new Map();
					const SIZE = input.replace(/[^0-9a-zA-Z]/gi,"").length;
					let sent = 0;
					
					return process(input, false, function(str){
						let pos = pIn(str,NUMBERS);						
						const index = Math.floor(queue.size/2);
						queue.set(index,pos[0]);
						queue.set(index+SIZE,pos[1]);
						
						let result = [];						
						const sendData = function(index) {
							let j = index*2;
							result.push(pOut(queue.get(j),queue.get(j+1)));
							sent++;
						}
						
						for (let i = sent; i < Math.floor(queue.size/4); i++)
							sendData(i);						
						if (queue.size !== SIZE*2) return result;
						
						for (let i = sent; sent < SIZE; i++)
							sendData(i);
						return result;
					}, 1);
				},
				decypher : function(input) {
					let queue = [];
					const SIZE = input.replace(/[^0-9a-zA-Z]/gi,"").length;
					let sent = 0;
					
					return process(input, false, function(str){
						let pos = pIn(str);
						queue.push(pos[0],pos[1]);
						
						let result = [];
						for (let i = sent; i < queue.length-SIZE; ++i) {
							result.push(pOut(queue[i],queue[i+SIZE]));
							sent++;
						}
						return result;
					}, 1);
				}, id : "29694"
			};
		}, omega : function(){	// Damn SIGIL!	
			return {
				cypher : function(input) { return undefined; },
				decypher : function(input) { return undefined; },
				id : "20024"
			};
		}
	};
	
	let KINGSTONE = function(){
		const STONE = ['l','s','g','c','a','o','p','k','h','i','t','q','w','b','e','r','d','u'];
		return {
			cypher : function(input) {
				var result = "";
				for (let c of input.toLowerCase()) {
					// If not found, prints 0
					result += (STONE.findIndex((val)=>(val==c))+1)+"-";
				}
				return result.slice(0,-1);
			},
			decypher : function(input) {
				var result = "";
				for (let index of input.split("-")) {
					var c = STONE[parseInt(index)-1];
					if (c === undefined) c = ' ';
					result += c;
				}
				return result;
			}
		};
		
	};
	
	let carosa = KINGSTONE();
	if (carosa.cypher("bluecrush") !== "14-1-18-15-4-16-18-2-9") throw new Error("Test failed: Kingstone Cypher");
	if (carosa.decypher("14-1-18-15-4-16-18-2-9") !== "bluecrush") throw new Error("Test failed: Kingstone Decypher");
	
	let sf;
	
	sf = SUREFIRE.alpha(MONTHS.JULY);	
	if (sf.cypher("hello world") !== "olssv dvysk") throw new Error("Test failed: Alpha Cypher");
	if (sf.decypher("OLSSV DVYSK") !== "HELLO WORLD") throw new Error("Test failed: Alpha Decypher");

	sf = SUREFIRE.beta();
	if (sf.cypher("HELLO WORLD") !== "EEAUEYEYII OUIIIYEYAO") throw new Error("Test failed: Beta Cypher");
	if (sf.decypher("eeaueyeyii ouiiiyeyao") !== "hello world") throw new Error("Test failed: Beta Decypher");

	sf = SUREFIRE.delta();
	if (sf.cypher("hello WORLD") !== "fnpol PARRD") throw new Error("Test failed: Delta Cypher");
	if (sf.decypher("FNPOL parrd") !== "HELLO world") throw new Error("Test failed: Delta Decypher");
	
	console.log("Secure uplink initiated...");
	
	return SUREFIRE.beta().decypher("eeaueyeyii ouiiiyeyao");
})(this);
