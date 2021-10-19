









window.NS = window.NS || {};
window.NS.Workflow = window.NS.Workflow || {};

window.NS.Workflow.getButtons = function() {
	var buttons = [];
	var buttonTokens = nlapiGetFieldValue('workflowbuttons').split('\u0005');
	for (var i = 0; i * 4 < buttonTokens.length; i++) {
		var button = {
			name: buttonTokens[i * 4],
			label: buttonTokens[i * 4 + 1],
			actionId: buttonTokens[i * 4 + 2],
			workflowInstanceId: buttonTokens[i * 4 + 3]};
		buttons[i] = buttons[button.name] = button;
	}
	return buttons;
};

window.NS.Workflow.buttonClick = function(clickedButton) {
	var location = document.location.href;
	var buttons = window.NS.Workflow.getButtons();

	var previousButton = nlapiGetFieldValue('workflowbuttonclicked');
	if (previousButton) {
		var message = clickedButton == previousButton
				? 'You have already pressed button \"{1:current button}\". The action is being processed, would you like to start processing the action again?'
				: 'You have pressed button \"{1:current button}\" which is part of the same button group as previously pressed button \"{2: previous button}\". The previously started processing is still in progress, would you like to start another one?';
		if (!confirm(format_message(message, buttons[clickedButton].label, buttons[previousButton].label)))
			return;
		location = addParamToURL(location, 'workflowbuttonmultipleclick', 'T');
	}
	nlapiSetFieldValue('workflowbuttonclicked', clickedButton);
	location = addParamToURL(location, 'workflowbutton', buttons[clickedButton].actionId);
	location = addParamToURL(location, 'workflowbuttoninstanceid', buttons[clickedButton].workflowInstanceId);
	document.location = location;
};