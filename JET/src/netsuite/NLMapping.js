function openMap1(address, type)
{
	var lines = address.split("\n");
	var mapUrl;
	if (type == 'google' || type == 'yahoo')
	{
		var addressLine = "";
		var i = 0;
		for(i = Math.min(1,lines.length); i < lines.length; i++)
		{
			var line = trim(lines[i]);
			if (line.length == 0)
				continue;
			line += ' ';
			addressLine += line;
		} 
		if (type == 'yahoo')
			mapUrl = "http://maps.yahoo.com/beta/index.php#trf=0&maxp=search&q1="+addressLine;
		else
			mapUrl = "http://maps.google.com/maps?q="+addressLine;
	}
	else
	{
		var country = "US";
		var streetAddress = "";
		var city = "";
		var state = "";
		var zip = "";
		var zipRegex = /([^,]*),?\s(..)\s(\d+)$/;
		var j = lines.length - 1;
		for (; j > 0; j--)
		{
			line = trim(lines[j]);
			if (line.length == 0)
				continue;
			if (/United\s*States/i.exec(line))
				continue;
			else if (/Canada/i.exec(line))
			{
				country = "CA";
				zipRegex = /([^,]*),?\s(..)\s([ABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Z]{1} *\d{1}[A-Z]{1}\d{1})$/;
			}
			else if (zipRegex.exec(line))
			{
				var result = line.match(zipRegex);
				if (result != null)
				{
					city = escape(result[1]);
					state = escape(result[2]);
					zip = escape(result[3]);
				}
			}
			else
			{
				streetAddress += line + ' ';
			}
		}
		mapUrl = "http://www.mapquest.com/maps/map.adp?searchtype=address&country="+country+"&address="+streetAddress+"&city="+city+"&state="+state+"&zip="+zip;
	}
	window.open(mapUrl);
}
function openMap2(address, type)
{
	var mapUrl, line;
	var lines = address.split("\n");

	if (type == 'yahoo' || type == 'google')
	{
		var addressLine = '';
		for(var i = Math.min(1,lines.length); i < lines.length; i++)
		{
			line = trim(lines[i]);
			line = line.replace(/\bUnited\s*Kingdom\b(\s*\(GB\))?/i, "United Kingdom");
			if (line.length == 0)
				continue;
			line += ' ';
			addressLine += line;
		} 
		if (type == 'yahoo')
			mapUrl = "http://maps.yahoo.com/beta/index.php#trf=0&maxp=search&q1="+addressLine;
		else
			mapUrl = "http://maps.google.com/maps?q=" + addressLine;
	}
	else
	{
		var j = lines.length - 1;
		var addr1="";
		var addr2="";
		var addr3="";
		var postcode="";

		for (; j > 0; j--)
		{
			line = trim(lines[j]);
			if (line.length == 0)
				continue;
			line = line.replace(/\bUnited\s*Kingdom\b(\s*\(GB\))?/i, " ");
			line = trim(line);
			if (postcode == "" && line.length > 0)
			{
				var postcodePattern = /\b([A-Z]\w\w?\w? \d[A-Z]{2}\b)/i;
				var result = line.match(postcodePattern);
				if (result != null)
				{
					postcode = result[1];
					line = line.replace(postcodePattern, " ");
				}
				line = trim(line);
			}
			if (line.length == 0)
				continue;
			if ( addr3 == "")
				addr3 = escape(line);
			else if ( addr2 == "")
				addr2 = escape(line);
			else if ( addr1 == "")
				addr1 = escape(line);
		}
		if (postcode == "")
		{
			alert("Cannot find a valid postcode.");
			return;
		}
		mapUrl = "http://www.multimap.com/maps/?hloc=GB|" + addr1+' '+addr2+' '+addr3+' '+postcode;
	}
	window.open(mapUrl);
}
function openMap3(address, type)
{
    var lines = address.split("\n");
    var line, streetAddress='', cityStateZip;
    var mapUrl;
    var i = 0;
      // assume for Japan address, the address line is right after the postal code line
      var postalCodeLineIndex = -1;
      for(i = 0; i < lines.length; i++)
      {
        line = trim(lines[i]);
        if (line.length == 0)
    	    continue;
        if(line.match(/^\d+\-?\d+$/))
        {
           postalCodeLineIndex = i;
           break;
        }
      }
      var addressLine = '';
      // if postal code line is not found, assume the first line is the address line
      if(postalCodeLineIndex < 0 || postalCodeLineIndex == lines.lengh-1)
        addressLine = trim(lines[0]);
      else
        addressLine = trim(lines[postalCodeLineIndex+1]);
  if (type == 'yahoo')
		mapUrl = "http://maps.yahoo.com/maps_result.php?q1="+addressLine;
  else
      mapUrl = "http://maps.google.co.jp/maps?f=q&hl=ja&q=" + addressLine;
      window.open(mapUrl);
}
function openMap4(address, type)
{
  var lines = address.split("\n");
	var addressLine = '';
	for(i = Math.min(1,lines.length); i < lines.length; i++)
	{
	  line = trim(lines[i]);
	  if (line.length == 0)
		  continue;
		line += ' ';
		addressLine += line;
	}
  if (type == 'yahoo')
		mapUrl = "http://maps.yahoo.com/maps_result.php?q1="+addressLine;
  else
	    mapUrl = "http://maps.google.com/maps?q=" + addressLine;
	window.open(mapUrl);
}
function openMap5(address, type)
{
  var lines = address.split("\n");
	var addressLine = '';
	for(i = Math.min(1,lines.length); i < lines.length; i++)
	{
	  line = trim(lines[i]);
	  if (line.length == 0)
		  continue;
		line += ' ';
		addressLine += line;
	} 
  if (type == 'yahoo')
		mapUrl = "http://maps.yahoo.com/maps_result.php?q1="+addressLine;
  else if (type == 'google')
	    mapUrl = "http://maps.google.com/maps?q=" + addressLine;
  else
	    mapUrl = "http://www.multimap.com/maps/?hloc=AU|" + addressLine;
	window.open(mapUrl);
}
var countryMap = new Array();
countryMap['CA']=1;
countryMap['US']=1;
countryMap['GB']=2;
countryMap['JP']=3;
countryMap['AF']=4;
countryMap['AX']=4;
countryMap['AL']=4;
countryMap['DZ']=4;
countryMap['AS']=4;
countryMap['AD']=4;
countryMap['AO']=4;
countryMap['AI']=4;
countryMap['AQ']=4;
countryMap['AG']=4;
countryMap['AR']=4;
countryMap['AM']=4;
countryMap['AW']=4;
countryMap['AT']=4;
countryMap['AZ']=4;
countryMap['BS']=4;
countryMap['BH']=4;
countryMap['BD']=4;
countryMap['BB']=4;
countryMap['BY']=4;
countryMap['BE']=4;
countryMap['BZ']=4;
countryMap['BJ']=4;
countryMap['BM']=4;
countryMap['BT']=4;
countryMap['BO']=4;
countryMap['BQ']=4;
countryMap['BA']=4;
countryMap['BW']=4;
countryMap['BV']=4;
countryMap['BR']=4;
countryMap['IO']=4;
countryMap['BN']=4;
countryMap['BG']=4;
countryMap['BF']=4;
countryMap['BI']=4;
countryMap['KH']=4;
countryMap['CM']=4;
countryMap['IC']=4;
countryMap['CV']=4;
countryMap['KY']=4;
countryMap['CF']=4;
countryMap['EA']=4;
countryMap['TD']=4;
countryMap['CL']=4;
countryMap['CN']=4;
countryMap['CX']=4;
countryMap['CC']=4;
countryMap['CO']=4;
countryMap['KM']=4;
countryMap['CD']=4;
countryMap['CG']=4;
countryMap['CK']=4;
countryMap['CR']=4;
countryMap['CI']=4;
countryMap['HR']=4;
countryMap['CU']=4;
countryMap['CW']=4;
countryMap['CY']=4;
countryMap['CZ']=4;
countryMap['DK']=4;
countryMap['DJ']=4;
countryMap['DM']=4;
countryMap['DO']=4;
countryMap['TL']=4;
countryMap['EC']=4;
countryMap['EG']=4;
countryMap['SV']=4;
countryMap['GQ']=4;
countryMap['ER']=4;
countryMap['EE']=4;
countryMap['ET']=4;
countryMap['FK']=4;
countryMap['FO']=4;
countryMap['FJ']=4;
countryMap['FI']=4;
countryMap['FR']=4;
countryMap['VU']=4;
countryMap['VE']=4;
countryMap['VN']=4;
countryMap['VG']=4;
countryMap['VI']=4;
countryMap['WF']=4;
countryMap['EH']=4;
countryMap['YE']=4;
countryMap['ZM']=4;
countryMap['ZW']=4;
countryMap['XK']=4;
countryMap['GF']=4;
countryMap['PF']=4;
countryMap['TF']=4;
countryMap['GA']=4;
countryMap['GM']=4;
countryMap['GE']=4;
countryMap['DE']=4;
countryMap['GH']=4;
countryMap['GI']=4;
countryMap['GR']=4;
countryMap['GL']=4;
countryMap['GD']=4;
countryMap['GP']=4;
countryMap['GU']=4;
countryMap['GT']=4;
countryMap['GG']=4;
countryMap['GW']=4;
countryMap['GN']=4;
countryMap['GY']=4;
countryMap['HT']=4;
countryMap['HM']=4;
countryMap['VA']=4;
countryMap['HN']=4;
countryMap['HK']=4;
countryMap['HU']=4;
countryMap['IS']=4;
countryMap['IN']=4;
countryMap['ID']=4;
countryMap['IR']=4;
countryMap['IQ']=4;
countryMap['IE']=4;
countryMap['IM']=4;
countryMap['IL']=4;
countryMap['IT']=4;
countryMap['JM']=4;
countryMap['JE']=4;
countryMap['JO']=4;
countryMap['KZ']=4;
countryMap['KE']=4;
countryMap['KI']=4;
countryMap['KP']=4;
countryMap['KR']=4;
countryMap['KW']=4;
countryMap['KG']=4;
countryMap['LA']=4;
countryMap['LV']=4;
countryMap['LB']=4;
countryMap['LS']=4;
countryMap['LR']=4;
countryMap['LY']=4;
countryMap['LI']=4;
countryMap['LT']=4;
countryMap['LU']=4;
countryMap['MO']=4;
countryMap['MK']=4;
countryMap['MG']=4;
countryMap['MW']=4;
countryMap['MY']=4;
countryMap['MV']=4;
countryMap['ML']=4;
countryMap['MT']=4;
countryMap['MH']=4;
countryMap['MQ']=4;
countryMap['MR']=4;
countryMap['MU']=4;
countryMap['YT']=4;
countryMap['MX']=4;
countryMap['FM']=4;
countryMap['MD']=4;
countryMap['MC']=4;
countryMap['MN']=4;
countryMap['ME']=4;
countryMap['MS']=4;
countryMap['MA']=4;
countryMap['MZ']=4;
countryMap['MM']=4;
countryMap['NA']=4;
countryMap['NR']=4;
countryMap['NP']=4;
countryMap['AN']=4;
countryMap['NL']=4;
countryMap['NC']=4;
countryMap['NZ']=4;
countryMap['NI']=4;
countryMap['NE']=4;
countryMap['NG']=4;
countryMap['NU']=4;
countryMap['NF']=4;
countryMap['MP']=4;
countryMap['NO']=4;
countryMap['OM']=4;
countryMap['PK']=4;
countryMap['PW']=4;
countryMap['PA']=4;
countryMap['PG']=4;
countryMap['PY']=4;
countryMap['PE']=4;
countryMap['PH']=4;
countryMap['PN']=4;
countryMap['PL']=4;
countryMap['PT']=4;
countryMap['PR']=4;
countryMap['QA']=4;
countryMap['RE']=4;
countryMap['RO']=4;
countryMap['RU']=4;
countryMap['RW']=4;
countryMap['BL']=4;
countryMap['SH']=4;
countryMap['KN']=4;
countryMap['LC']=4;
countryMap['MF']=4;
countryMap['VC']=4;
countryMap['WS']=4;
countryMap['SM']=4;
countryMap['ST']=4;
countryMap['SA']=4;
countryMap['SN']=4;
countryMap['CS']=4;
countryMap['RS']=4;
countryMap['SC']=4;
countryMap['SL']=4;
countryMap['SG']=4;
countryMap['SX']=4;
countryMap['SK']=4;
countryMap['SI']=4;
countryMap['SB']=4;
countryMap['SO']=4;
countryMap['ZA']=4;
countryMap['GS']=4;
countryMap['SS']=4;
countryMap['ES']=4;
countryMap['LK']=4;
countryMap['PM']=4;
countryMap['PS']=4;
countryMap['SD']=4;
countryMap['SR']=4;
countryMap['SJ']=4;
countryMap['SZ']=4;
countryMap['SE']=4;
countryMap['CH']=4;
countryMap['SY']=4;
countryMap['TW']=4;
countryMap['TJ']=4;
countryMap['TZ']=4;
countryMap['TH']=4;
countryMap['TG']=4;
countryMap['TK']=4;
countryMap['TO']=4;
countryMap['TT']=4;
countryMap['TN']=4;
countryMap['TR']=4;
countryMap['TM']=4;
countryMap['TC']=4;
countryMap['TV']=4;
countryMap['UG']=4;
countryMap['UA']=4;
countryMap['AE']=4;
countryMap['UY']=4;
countryMap['UM']=4;
countryMap['UZ']=4;
countryMap['AU']=5;

function callMapFunctionByIndex(index, address, type)
{
var functions = [openMap1,openMap2,openMap3,openMap4,openMap5]
return functions[index-1](address, type);
}
function getCountry(line)
{
var country;
if (/Great\s*Britain/i.exec(line) || /United\s*Kingdom/i.exec(line))
country="GB";
	else if (/Afghanistan/i.exec(line))
		country="AF";
	else if (/Aland\s*Islands/i.exec(line))
		country="AX";
	else if (/Albania/i.exec(line))
		country="AL";
	else if (/Algeria/i.exec(line))
		country="DZ";
	else if (/American\s*Samoa/i.exec(line))
		country="AS";
	else if (/Andorra/i.exec(line))
		country="AD";
	else if (/Angola/i.exec(line))
		country="AO";
	else if (/Anguilla/i.exec(line))
		country="AI";
	else if (/Antarctica/i.exec(line))
		country="AQ";
	else if (/Antigua\s*and\s*Barbuda/i.exec(line))
		country="AG";
	else if (/Argentina/i.exec(line))
		country="AR";
	else if (/Armenia/i.exec(line))
		country="AM";
	else if (/Aruba/i.exec(line))
		country="AW";
	else if (/Australia/i.exec(line))
		country="AU";
	else if (/Austria/i.exec(line))
		country="AT";
	else if (/Azerbaijan/i.exec(line))
		country="AZ";
	else if (/Bahamas/i.exec(line))
		country="BS";
	else if (/Bahrain/i.exec(line))
		country="BH";
	else if (/Bangladesh/i.exec(line))
		country="BD";
	else if (/Barbados/i.exec(line))
		country="BB";
	else if (/Belarus/i.exec(line))
		country="BY";
	else if (/Belgium/i.exec(line))
		country="BE";
	else if (/Belize/i.exec(line))
		country="BZ";
	else if (/Benin/i.exec(line))
		country="BJ";
	else if (/Bermuda/i.exec(line))
		country="BM";
	else if (/Bhutan/i.exec(line))
		country="BT";
	else if (/Bolivia/i.exec(line))
		country="BO";
	else if (/Bonaire,\s*Saint\s*Eustatius\s*and\s*Saba/i.exec(line))
		country="BQ";
	else if (/Bosnia\s*and\s*Herzegovina/i.exec(line))
		country="BA";
	else if (/Botswana/i.exec(line))
		country="BW";
	else if (/Bouvet\s*Island/i.exec(line))
		country="BV";
	else if (/Brazil/i.exec(line))
		country="BR";
	else if (/British\s*Indian\s*Ocean\s*Territory/i.exec(line))
		country="IO";
	else if (/Brunei\s*Darussalam/i.exec(line))
		country="BN";
	else if (/Bulgaria/i.exec(line))
		country="BG";
	else if (/Burkina\s*Faso/i.exec(line))
		country="BF";
	else if (/Burundi/i.exec(line))
		country="BI";
	else if (/Cambodia/i.exec(line))
		country="KH";
	else if (/Cameroon/i.exec(line))
		country="CM";
	else if (/Canada/i.exec(line))
		country="CA";
	else if (/Canary\s*Islands/i.exec(line))
		country="IC";
	else if (/Cape\s*Verde/i.exec(line))
		country="CV";
	else if (/Cayman\s*Islands/i.exec(line))
		country="KY";
	else if (/Central\s*African\s*Republic/i.exec(line))
		country="CF";
	else if (/Ceuta\s*and\s*Melilla/i.exec(line))
		country="EA";
	else if (/Chad/i.exec(line))
		country="TD";
	else if (/Chile/i.exec(line))
		country="CL";
	else if (/China/i.exec(line))
		country="CN";
	else if (/Christmas\s*Island/i.exec(line))
		country="CX";
	else if (/Cocos\s*(Keeling)\s*Islands/i.exec(line))
		country="CC";
	else if (/Colombia/i.exec(line))
		country="CO";
	else if (/Comoros/i.exec(line))
		country="KM";
	else if (/Congo,\s*Democratic\s*Republic\s*of/i.exec(line))
		country="CD";
	else if (/Congo,\s*Republic\s*of/i.exec(line))
		country="CG";
	else if (/Cook\s*Islands/i.exec(line))
		country="CK";
	else if (/Costa\s*Rica/i.exec(line))
		country="CR";
	else if (/Cote\s*d'Ivoire/i.exec(line))
		country="CI";
	else if (/Croatia\s*Hrvatska/i.exec(line))
		country="HR";
	else if (/Cuba/i.exec(line))
		country="CU";
	else if (/Curaçao/i.exec(line))
		country="CW";
	else if (/Cyprus/i.exec(line))
		country="CY";
	else if (/Czech\s*Republic/i.exec(line))
		country="CZ";
	else if (/Denmark/i.exec(line))
		country="DK";
	else if (/Djibouti/i.exec(line))
		country="DJ";
	else if (/Dominica/i.exec(line))
		country="DM";
	else if (/Dominican\s*Republic/i.exec(line))
		country="DO";
	else if (/East\s*Timor/i.exec(line))
		country="TL";
	else if (/Ecuador/i.exec(line))
		country="EC";
	else if (/Egypt/i.exec(line))
		country="EG";
	else if (/El\s*Salvador/i.exec(line))
		country="SV";
	else if (/Equatorial\s*Guinea/i.exec(line))
		country="GQ";
	else if (/Eritrea/i.exec(line))
		country="ER";
	else if (/Estonia/i.exec(line))
		country="EE";
	else if (/Ethiopia/i.exec(line))
		country="ET";
	else if (/Falkland\s*Islands/i.exec(line))
		country="FK";
	else if (/Faroe\s*Islands/i.exec(line))
		country="FO";
	else if (/Fiji/i.exec(line))
		country="FJ";
	else if (/Finland/i.exec(line))
		country="FI";
	else if (/France/i.exec(line))
		country="FR";
	else if (/Vanuatu/i.exec(line))
		country="VU";
	else if (/Venezuela/i.exec(line))
		country="VE";
	else if (/Vietnam/i.exec(line))
		country="VN";
	else if (/Virgin\s*Islands\s*(British)/i.exec(line))
		country="VG";
	else if (/Virgin\s*Islands\s*(USA)/i.exec(line))
		country="VI";
	else if (/Wallis\s*and\s*Futuna/i.exec(line))
		country="WF";
	else if (/Western\s*Sahara/i.exec(line))
		country="EH";
	else if (/Yemen/i.exec(line))
		country="YE";
	else if (/Zambia/i.exec(line))
		country="ZM";
	else if (/Zimbabwe/i.exec(line))
		country="ZW";
	else if (/Kosovo/i.exec(line))
		country="XK";
	else if (/French\s*Guiana/i.exec(line))
		country="GF";
	else if (/French\s*Polynesia/i.exec(line))
		country="PF";
	else if (/French\s*Southern\s*Territories/i.exec(line))
		country="TF";
	else if (/Gabon/i.exec(line))
		country="GA";
	else if (/Gambia/i.exec(line))
		country="GM";
	else if (/Georgia/i.exec(line))
		country="GE";
	else if (/Germany/i.exec(line))
		country="DE";
	else if (/Ghana/i.exec(line))
		country="GH";
	else if (/Gibraltar/i.exec(line))
		country="GI";
	else if (/Greece/i.exec(line))
		country="GR";
	else if (/Greenland/i.exec(line))
		country="GL";
	else if (/Grenada/i.exec(line))
		country="GD";
	else if (/Guadeloupe/i.exec(line))
		country="GP";
	else if (/Guam/i.exec(line))
		country="GU";
	else if (/Guatemala/i.exec(line))
		country="GT";
	else if (/Guernsey/i.exec(line))
		country="GG";
	else if (/Guinea-Bissau/i.exec(line))
		country="GW";
	else if (/Guinea/i.exec(line))
		country="GN";
	else if (/Guyana/i.exec(line))
		country="GY";
	else if (/Haiti/i.exec(line))
		country="HT";
	else if (/Heard\s*and\s*McDonald\s*Islands/i.exec(line))
		country="HM";
	else if (/Holy\s*See\s*(City\s*Vatican\s*State)/i.exec(line))
		country="VA";
	else if (/Honduras/i.exec(line))
		country="HN";
	else if (/Hong\s*Kong/i.exec(line))
		country="HK";
	else if (/Hungary/i.exec(line))
		country="HU";
	else if (/Iceland/i.exec(line))
		country="IS";
	else if (/India/i.exec(line))
		country="IN";
	else if (/Indonesia/i.exec(line))
		country="ID";
	else if (/Iran\s*(Islamic\s*Republic\s*of)/i.exec(line))
		country="IR";
	else if (/Iraq/i.exec(line))
		country="IQ";
	else if (/Ireland/i.exec(line))
		country="IE";
	else if (/Isle\s*of\s*Man/i.exec(line))
		country="IM";
	else if (/Israel/i.exec(line))
		country="IL";
	else if (/Italy/i.exec(line))
		country="IT";
	else if (/Jamaica/i.exec(line))
		country="JM";
	else if (/Japan/i.exec(line))
		country="JP";
	else if (/Jersey/i.exec(line))
		country="JE";
	else if (/Jordan/i.exec(line))
		country="JO";
	else if (/Kazakhstan/i.exec(line))
		country="KZ";
	else if (/Kenya/i.exec(line))
		country="KE";
	else if (/Kiribati/i.exec(line))
		country="KI";
	else if (/Korea,\s*Democratic\s*People's\s*Republic/i.exec(line))
		country="KP";
	else if (/Korea,\s*Republic\s*of/i.exec(line))
		country="KR";
	else if (/Kuwait/i.exec(line))
		country="KW";
	else if (/Kyrgyzstan/i.exec(line))
		country="KG";
	else if (/Lao\s*People's\s*Democratic\s*Republic/i.exec(line))
		country="LA";
	else if (/Latvia/i.exec(line))
		country="LV";
	else if (/Lebanon/i.exec(line))
		country="LB";
	else if (/Lesotho/i.exec(line))
		country="LS";
	else if (/Liberia/i.exec(line))
		country="LR";
	else if (/Libya/i.exec(line))
		country="LY";
	else if (/Liechtenstein/i.exec(line))
		country="LI";
	else if (/Lithuania/i.exec(line))
		country="LT";
	else if (/Luxembourg/i.exec(line))
		country="LU";
	else if (/Macau/i.exec(line))
		country="MO";
	else if (/Macedonia/i.exec(line))
		country="MK";
	else if (/Madagascar/i.exec(line))
		country="MG";
	else if (/Malawi/i.exec(line))
		country="MW";
	else if (/Malaysia/i.exec(line))
		country="MY";
	else if (/Maldives/i.exec(line))
		country="MV";
	else if (/Mali/i.exec(line))
		country="ML";
	else if (/Malta/i.exec(line))
		country="MT";
	else if (/Marshall\s*Islands/i.exec(line))
		country="MH";
	else if (/Martinique/i.exec(line))
		country="MQ";
	else if (/Mauritania/i.exec(line))
		country="MR";
	else if (/Mauritius/i.exec(line))
		country="MU";
	else if (/Mayotte/i.exec(line))
		country="YT";
	else if (/Mexico/i.exec(line))
		country="MX";
	else if (/Micronesia,\s*Federal\s*State\s*of/i.exec(line))
		country="FM";
	else if (/Moldova,\s*Republic\s*of/i.exec(line))
		country="MD";
	else if (/Monaco/i.exec(line))
		country="MC";
	else if (/Mongolia/i.exec(line))
		country="MN";
	else if (/Montenegro/i.exec(line))
		country="ME";
	else if (/Montserrat/i.exec(line))
		country="MS";
	else if (/Morocco/i.exec(line))
		country="MA";
	else if (/Mozambique/i.exec(line))
		country="MZ";
	else if (/Myanmar\s*(Burma)/i.exec(line))
		country="MM";
	else if (/Namibia/i.exec(line))
		country="NA";
	else if (/Nauru/i.exec(line))
		country="NR";
	else if (/Nepal/i.exec(line))
		country="NP";
	else if (/Netherlands\s*Antilles\s*(Deprecated)/i.exec(line))
		country="AN";
	else if (/Netherlands/i.exec(line))
		country="NL";
	else if (/New\s*Caledonia/i.exec(line))
		country="NC";
	else if (/New\s*Zealand/i.exec(line))
		country="NZ";
	else if (/Nicaragua/i.exec(line))
		country="NI";
	else if (/Niger/i.exec(line))
		country="NE";
	else if (/Nigeria/i.exec(line))
		country="NG";
	else if (/Niue/i.exec(line))
		country="NU";
	else if (/Norfolk\s*Island/i.exec(line))
		country="NF";
	else if (/Northern\s*Mariana\s*Islands/i.exec(line))
		country="MP";
	else if (/Norway/i.exec(line))
		country="NO";
	else if (/Oman/i.exec(line))
		country="OM";
	else if (/Pakistan/i.exec(line))
		country="PK";
	else if (/Palau/i.exec(line))
		country="PW";
	else if (/Panama/i.exec(line))
		country="PA";
	else if (/Papua\s*New\s*Guinea/i.exec(line))
		country="PG";
	else if (/Paraguay/i.exec(line))
		country="PY";
	else if (/Peru/i.exec(line))
		country="PE";
	else if (/Philippines/i.exec(line))
		country="PH";
	else if (/Pitcairn\s*Island/i.exec(line))
		country="PN";
	else if (/Poland/i.exec(line))
		country="PL";
	else if (/Portugal/i.exec(line))
		country="PT";
	else if (/Puerto\s*Rico/i.exec(line))
		country="PR";
	else if (/Qatar/i.exec(line))
		country="QA";
	else if (/Reunion\s*Island/i.exec(line))
		country="RE";
	else if (/Romania/i.exec(line))
		country="RO";
	else if (/Russian\s*Federation/i.exec(line))
		country="RU";
	else if (/Rwanda/i.exec(line))
		country="RW";
	else if (/Saint\s*Barthélemy/i.exec(line))
		country="BL";
	else if (/Saint\s*Helena/i.exec(line))
		country="SH";
	else if (/Saint\s*Kitts\s*and\s*Nevis/i.exec(line))
		country="KN";
	else if (/Saint\s*Lucia/i.exec(line))
		country="LC";
	else if (/Saint\s*Martin/i.exec(line))
		country="MF";
	else if (/Saint\s*Vincent\s*and\s*the\s*Grenadines/i.exec(line))
		country="VC";
	else if (/Samoa/i.exec(line))
		country="WS";
	else if (/San\s*Marino/i.exec(line))
		country="SM";
	else if (/Sao\s*Tome\s*and\s*Principe/i.exec(line))
		country="ST";
	else if (/Saudi\s*Arabia/i.exec(line))
		country="SA";
	else if (/Senegal/i.exec(line))
		country="SN";
	else if (/Serbia\s*and\s*Montenegro\s*(Deprecated)/i.exec(line))
		country="CS";
	else if (/Serbia/i.exec(line))
		country="RS";
	else if (/Seychelles/i.exec(line))
		country="SC";
	else if (/Sierra\s*Leone/i.exec(line))
		country="SL";
	else if (/Singapore/i.exec(line))
		country="SG";
	else if (/Sint\s*Maarten/i.exec(line))
		country="SX";
	else if (/Slovak\s*Republic/i.exec(line))
		country="SK";
	else if (/Slovenia/i.exec(line))
		country="SI";
	else if (/Solomon\s*Islands/i.exec(line))
		country="SB";
	else if (/Somalia/i.exec(line))
		country="SO";
	else if (/South\s*Africa/i.exec(line))
		country="ZA";
	else if (/South\s*Georgia/i.exec(line))
		country="GS";
	else if (/South\s*Sudan/i.exec(line))
		country="SS";
	else if (/Spain/i.exec(line))
		country="ES";
	else if (/Sri\s*Lanka/i.exec(line))
		country="LK";
	else if (/St.\s*Pierre\s*and\s*Miquelon/i.exec(line))
		country="PM";
	else if (/State\s*of\s*Palestine/i.exec(line))
		country="PS";
	else if (/Sudan/i.exec(line))
		country="SD";
	else if (/Suriname/i.exec(line))
		country="SR";
	else if (/Svalbard\s*and\s*Jan\s*Mayen\s*Islands/i.exec(line))
		country="SJ";
	else if (/Swaziland/i.exec(line))
		country="SZ";
	else if (/Sweden/i.exec(line))
		country="SE";
	else if (/Switzerland/i.exec(line))
		country="CH";
	else if (/Syrian\s*Arab\s*Republic/i.exec(line))
		country="SY";
	else if (/Taiwan/i.exec(line))
		country="TW";
	else if (/Tajikistan/i.exec(line))
		country="TJ";
	else if (/Tanzania/i.exec(line))
		country="TZ";
	else if (/Thailand/i.exec(line))
		country="TH";
	else if (/Togo/i.exec(line))
		country="TG";
	else if (/Tokelau/i.exec(line))
		country="TK";
	else if (/Tonga/i.exec(line))
		country="TO";
	else if (/Trinidad\s*and\s*Tobago/i.exec(line))
		country="TT";
	else if (/Tunisia/i.exec(line))
		country="TN";
	else if (/Turkey/i.exec(line))
		country="TR";
	else if (/Turkmenistan/i.exec(line))
		country="TM";
	else if (/Turks\s*and\s*Caicos\s*Islands/i.exec(line))
		country="TC";
	else if (/Tuvalu/i.exec(line))
		country="TV";
	else if (/Uganda/i.exec(line))
		country="UG";
	else if (/Ukraine/i.exec(line))
		country="UA";
	else if (/United\s*Arab\s*Emirates/i.exec(line))
		country="AE";
	else if (/United\s*Kingdom/i.exec(line))
		country="GB";
	else if (/United\s*States/i.exec(line))
		country="US";
	else if (/Uruguay/i.exec(line))
		country="UY";
	else if (/US\s*Minor\s*Outlying\s*Islands/i.exec(line))
		country="UM";
	else if (/Uzbekistan/i.exec(line))
		country="UZ";
return country
}
