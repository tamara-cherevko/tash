/**
 * @author tash
 * @class ProgressBar
 * 
 */
// TO DO:
// updateProgress(newValue){
	// progressBar.value = newValue;
    // progressBar.getElementsByTagName('span')[0].textContent = newValue;
// }

// Tash.Class('Tash.component.ProgressBar', {
	// init : function(){
		var progress = document.querySelector('#progress');
		progress.min = 0;
		progress.max = 100;
		console.log(progress.position)
		window.setInterval(function(){
			if(progress.value !== progress.max){
				progress.value ++;
			} else{ 
				progress.value = progress.min;
			}
		}, 60)	
	// }
// });	
	