(function(global){
	"strict mode";
	
	let funcSeperatedString = function(arr) {
		const SEPARATOR = ' ';
		let result = "";
		for (let item of arr)
			result += item + SEPARATOR;
		return result.substring(0,result.length-SEPARATOR.length);
	}

	let funcTransform1 = function(text) {
		let result = new Array();
		for (var i = 0; i < text.length; ++i) {
			let ascii = text.charCodeAt(i);
			let binary = "";
			for (var j = 7; j >= 0; j--) {
				let old = ascii;
				ascii%=Math.pow(2,j);
				binary += (ascii<old)?'1':'0';
			}
			result.push(binary);
		}
		return funcSeperatedString(result);
	};

	let funcTransform2 = function(text) {
		let funcCypher = function(text, index) {			
			let afterNothing, after0, after1;
			if (text[index] === '1') { // 1 after...
				afterNothing = 'b';
				after0 = 'e';
				after1 = 'f';
			}
			else { // 0 after...  
				afterNothing = 'a';
				after0 = 'c';
				after1 = 'd';
			}
			if (index === 0) return afterNothing;
			return (text[index-1] === '1') ? after1: after0;
		};

		let result = new Array();
		const temp = text.split(' ')
		for (let binary of temp) {
			let cypher = "";
			for (let i = 0; i < binary.length; ++i)
				cypher += funcCypher(binary, i);
			result.push(cypher);
		}
		return funcSeperatedString(result);
	};
	
	let run = function(text) {
		console.log("Text = "+text);
		let binary = funcTransform1(text);
		console.log("Binary = "+binary);
		let cypher = funcTransform2(binary);
		console.log("Final cypher: "+cypher);
		return cypher;
	};

	// TODO: Insert tests here
	return run("Hello");

})(this);
