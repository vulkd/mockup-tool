function downloadFile(data, name = 'file', type = 'text/plain') {
  const anchor = document.createElement('a')
  anchor.href = window.URL.createObjectURL(new Blob([data], { type }))
  anchor.download = name
  anchor.click()
}

export default function (date, name, type="text/plain") {
	const anchor = document.createElement("a");
	anchor.href = window.URL.createObjectURL(new Blob([data], { type }));
	anchor.download = name;
  anchor.click();

	const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, indent))}`;
	const downloadAnchorNode = document.createElement("a");
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", exportName);
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}
