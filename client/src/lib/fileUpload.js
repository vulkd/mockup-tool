export default function (opts, callback) {
	const fileInput = document.createElement("input");
	fileInput.type = 'file';
	fileInput.style.display = 'none';
	fileInput.addEventListener('change', callback);
	if (opts.multiple) fileInput.setAttribute('multiple', true);
	document.body.appendChild(fileInput); // required for firefox
  fileInput.click();
  fileInput.remove();
}

