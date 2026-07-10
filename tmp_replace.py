import re
import codecs

path = 'public/js/genogram/main.js'
with codecs.open(path, 'r', 'utf-8') as f:
    code = f.read()

# _handleSave
code = code.replace("alert('Genogram successfully updated for the selected patient!');", "alert(window.t ? window.t('gnSaveSuccess') : 'Genogram successfully updated for the selected patient!');")
code = code.replace("<option value=\"\">(No active patients found)</option>", "<option value=\"\">${window.t ? window.t('gnNoActivePatients') : '(No active patients found)'}</option>")
code = code.replace("<option value=\"\">-- Choose a patient --</option>", "<option value=\"\">${window.t ? window.t('gnChoosePatient') : '-- Choose a patient --'}</option>")

# _handleLoad
code = code.replace("confirm(\"You have unsaved changes. Loading a new genogram will overwrite your current progress. Continue?\")", "confirm(window.t ? window.t('gnUnsavedChanges') : \"You have unsaved changes...\")")

# _renderPropsPanel
code = code.replace("<div class=\"props-empty\"><p>Select a person<br>to edit properties.<br></p></div>", "<div class=\"props-empty\"><p>${window.t ? window.t('gnSelectEmpty') : 'Select a person...'}</div>")
code = code.replace("<div class=\"props-empty\"><p>Select a person or relationship<br>to edit properties.</p></div>", "<div class=\"props-empty\"><p>${window.t ? window.t('gnSelectEmpty') : 'Select a person...'}</p></div>")

code = code.replace("<h4 class=\"props-title\">Person Properties</h4>", "<h4 class=\"props-title\">${window.t ? window.t('gnPersonProps') : 'Person Properties'}</h4>")
code = code.replace("<label class=\"props-label\">Name", "<label class=\"props-label\">${window.t ? window.t('gnName') : 'Name'}")
code = code.replace("<label class=\"props-label\">Gender", "<label class=\"props-label\">${window.t ? window.t('gnGender') : 'Gender'}")
code = code.replace(">Male (□)<", ">${window.t ? window.t('gnMaleOption') : 'Male (□)'}<")
code = code.replace(">Female (○)<", ">${window.t ? window.t('gnFemaleOption') : 'Female (○)'}<")
code = code.replace("<label class=\"props-label\">Date of Birth", "<label class=\"props-label\">${window.t ? window.t('gnDOB') : 'Date of Birth'}")

code = re.sub(r'Deceased(\s*)</label>', r'${window.t ? window.t(\'gnDeceased\') : \'Deceased\'}\1</label>', code)
code = code.replace("<label class=\"props-label\">Date of Death", "<label class=\"props-label\">${window.t ? window.t('gnDOD') : 'Date of Death'}")
code = re.sub(r'Index Patient(\s*)</label>', r'${window.t ? window.t(\'gnIndexPatient\') : \'Index Patient\'}\1</label>', code)
code = code.replace("🗑 Delete Person", "🗑 ${window.t ? window.t('gnDeletePerson') : 'Delete Person'}")

code = code.replace("<h4 class=\"props-title\">Couple Relationship</h4>", "<h4 class=\"props-title\">${window.t ? window.t('gnCoupleRel') : 'Couple Relationship'}</h4>")
code = code.replace("<div class=\"props-label\">Current Style", "<div class=\"props-label\">${window.t ? window.t('gnCurrentStyle') : 'Current Style'}")
code = code.replace("✏️ Change Style Visually", "✏️ ${window.t ? window.t('gnChangeStyle') : 'Change Style Visually'}")
code = code.replace("🗑 Delete Relationship", "🗑 ${window.t ? window.t('gnDeleteRel') : 'Delete Relationship'}")

code = code.replace("<h4 class=\"props-title\">Child Link</h4>", "<h4 class=\"props-title\">${window.t ? window.t('gnChildLink') : 'Child Link'}</h4>")
code = code.replace("🗑 Delete Child Link", "🗑 ${window.t ? window.t('gnDeleteChildLk') : 'Delete Child Link'}")

code = code.replace("<h4 class=\"props-title\">Emotional Relationship</h4>", "<h4 class=\"props-title\">${window.t ? window.t('gnEmotionalRel') : 'Emotional Relationship'}</h4>")
code = code.replace("🗑 Delete Emotional Link", "🗑 ${window.t ? window.t('gnDeleteEmoLk') : 'Delete Emotional Link'}")

# _buildHTML
code = re.sub(r'<button class="geno-tool geno-btn-undo"([^>]*)>↩ Undo</button>', r'<button class="geno-tool geno-btn-undo"\1><span data-i18n="gnUndo">↩ Undo</span></button>', code)
code = re.sub(r'<button class="geno-tool geno-btn-redo"([^>]*)>↪ Redo</button>', r'<button class="geno-tool geno-btn-redo"\1><span data-i18n="gnRedo">↪ Redo</span></button>', code)
code = re.sub(r'<button class="geno-tool geno-btn-delete"([^>]*)>🗑 Delete</button>', r'<button class="geno-tool geno-btn-delete"\1><span data-i18n="gnDelete">🗑 Delete</span></button>', code)
code = re.sub(r'<button class="geno-tool geno-btn-zoomout"([^>]*)>−</button>', r'<button class="geno-tool geno-btn-zoomout"\1>−</button>', code)
code = re.sub(r'<button class="geno-tool geno-btn-zoomin"([^>]*)>\+</button>', r'<button class="geno-tool geno-btn-zoomin"\1>+</button>', code)
code = re.sub(r'<button class="geno-tool geno-btn-zoomfit"([^>]*)>⊡ Fit</button>', r'<button class="geno-tool geno-btn-zoomfit"\1><span data-i18n="gnFit">⊡ Fit</span></button>', code)
code = re.sub(r'<button class="geno-tool geno-tool--save geno-btn-save"([^>]*)>💾 Save to Patient</button>', r'<button class="geno-tool geno-tool--save geno-btn-save"\1>💾 <span data-i18n="gnSaveToPatient">Save to Patient</span></button>', code)
code = re.sub(r'<button class="geno-tool geno-tool--load geno-btn-load"([^>]*)>📂 Load</button>', r'<button class="geno-tool geno-tool--load geno-btn-load"\1>📂 <span data-i18n="gnLoad">Load</span></button>', code)
code = re.sub(r'<button class="geno-tool geno-tool--export geno-btn-export"([^>]*)>⬇ Export</button>', r'<button class="geno-tool geno-tool--export geno-btn-export"\1>⬇ <span data-i18n="gnExport">Export PNG</span></button>', code)

code = code.replace("<div class=\"symbol-section-label\">Symbols</div>", "<div class=\"symbol-section-label\" data-i18n=\"gnSymbols\">Symbols</div>")
code = code.replace("<span>Male</span>", "<span data-i18n=\"gnMale\">Male</span>")
code = code.replace("<span>Female</span>", "<span data-i18n=\"gnFemale\">Female</span>")

code = code.replace("<h3>Select Relationship Type</h3>", "<h3 data-i18n=\"gnSelectRelType\">Select Relationship Type</h3>")
code = code.replace("<p class=\"modal-cat-label\">Family / Partner</p>", "<p class=\"modal-cat-label\" data-i18n=\"gnFamilyPartner\">Family / Partner</p>")
code = code.replace("<p class=\"modal-cat-label\">Emotional</p>", "<p class=\"modal-cat-label\" data-i18n=\"gnEmotionalGrp\">Emotional</p>")

code = code.replace("<h3>Select Child Relationship</h3>", "<h3 data-i18n=\"gnSelectChildRel\">Select Child Relationship</h3>")
code = code.replace("<p class=\"modal-cat-label\">Child Type</p>", "<p class=\"modal-cat-label\" data-i18n=\"gnChildType\">Child Type</p>")

code = code.replace("<h3>Save to Patient Profile</h3>", "<h3 data-i18n=\"gnSaveProfile\">Save to Patient Profile</h3>")
code = code.replace("<p style=\"font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;\">Select a patient to attach this genogram to their profile.</p>", "<p style=\"font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;\" data-i18n=\"gnSaveDesc\">Select a patient to attach this genogram to their profile.</p>")
code = code.replace("Loading patients...", "${window.t ? window.t('gnLoadingPatients') : 'Loading patients...'}")
code = code.replace("<button id=\"geno-btn-confirm-save-${this.containerId}\" class=\"btn btn-primary\" style=\"width: 100%;\">Save Genogram</button>", "<button id=\"geno-btn-confirm-save-${this.containerId}\" class=\"btn btn-primary\" style=\"width: 100%;\" data-i18n=\"gnSaveProfile\">Save Genogram</button>")

code = code.replace("<h3>Load Patient Genogram</h3>", "<h3 data-i18n=\"gnLoadProfile\">Load Patient Genogram</h3>")
code = code.replace("<p style=\"font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;\">Select a patient to load their genogram into the editor.</p>", "<p style=\"font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;\" data-i18n=\"gnLoadDesc\">Select a patient to load their genogram into the editor.</p>")
code = code.replace("<button id=\"geno-btn-confirm-load-${this.containerId}\" class=\"btn btn-success\" style=\"width: 100%;\">Load Genogram</button>", "<button id=\"geno-btn-confirm-load-${this.containerId}\" class=\"btn btn-success\" style=\"width: 100%;\" data-i18n=\"gnLoadProfile\">Load Genogram</button>")

# Modals bind
code = code.replace("alert('Please select a patient first.')", "alert(window.t ? window.t('gnPatientReq') : 'Please select a patient first.')")
code = code.replace("alert('Genogram successfully saved and mapped to patient!')", "alert(window.t ? window.t('gnSaveSuccess') : 'Genogram successfully saved and mapped to patient!')")
code = code.replace("alert('Error saving genogram: ' + err.message)", "alert((window.t ? window.t('gnErrSave') : 'Error saving genogram: ') + err.message)")
code = code.replace("alert('Genogram successfully loaded!')", "alert(window.t ? window.t('gnLoadSuccess') : 'Genogram successfully loaded!')")
code = code.replace("alert('Error loading genogram: ' + err.message)", "alert((window.t ? window.t('gnErrLoad') : 'Error loading genogram: ') + err.message)")

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(code)

print('Success')
