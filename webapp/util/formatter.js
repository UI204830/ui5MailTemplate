sap.ui.define([
		"sap/ui/core/format/FileSizeFormat"
	],

	function (FileSizeFormat) {

		return {

			formatAttribute: function (sValue) {
				return FileSizeFormat.getInstance({
					maxFractionDigits: 1,
					maxIntegerDigits: 4
				}).format(sValue);
			}
		}

	});
