//formulaire de création de classe
$('body').on('click', '.teacher-new-classe', function (event) {
    ClassroomSettings.classroom = null
    navigatePanel('classroom-dashboard-form-classe-panel', 'dashboard-classes-teacher')
})


//student modal-->supprimer
$('body').on('click', '.modal-student-delete', function () {
    let confirm = window.confirm(i18next.t("classroom.notif.deleteAccount"))
    if (confirm) {
        ClassroomSettings.student = parseInt($(this).parent().parent().parent().attr('data-student-id'))
        Main.getClassroomManager().deleteStudent(ClassroomSettings.student).then(function (response) {
            let classroom = deleteStudentInList(ClassroomSettings.student, ClassroomSettings.classroom)
            displayStudentsInClassroom(classroom.students)
            displayNotification('#notif-div', "classroom.notif.accountIsDelete", "success")
        })
    }
})

//student modal-->restaurer le mot de passe
$('body').on('click', '.modal-student-password', function () {
    let self = $(this)
    ClassroomSettings.student = parseInt(self.parent().parent().parent().attr('data-student-id'))
    Main.getClassroomManager().generatePassword(ClassroomSettings.student).then(function (response) {
        displayNotification('#notif-div', "classroom.notif.newPwd", "success", {
            "pseudo": response.pseudo,
            "pwd": response.mdp
        })
        self.parent().find('.pwd-display-stud .masked').html(response.mdp)

    })

})
//student modal-->modifier le pseudo

function changePseudoModal(pseudo, id) {
    ClassroomSettings.student = id
    $('.change-pseudo-modal').val(pseudo)
    pseudoModal.openModal('update-pseudo-modal')
}
$('body').on('click', '#update-pseudo-close', function () {
    Main.getClassroomManager().changePseudo(ClassroomSettings.student, $('.change-pseudo-modal').val()).then(function (formerPseudo) {
        pseudoModal.closeModal('update-pseudo-modal');
        $("#body-table-teach").find(`[data-student-id='${ClassroomSettings.student}']`).html($('.change-pseudo-modal').val() + '  <i class="fas fa-cog"></i>');
        changePseudoStudentInList(ClassroomSettings.student, ClassroomSettings.classroom, $('.change-pseudo-modal').val());
        displayNotification('#notif-div', "classroom.notif.pseudoUpdated", "success", `'{"newPseudo": "${$('.change-pseudo-modal').val()}"}'`);
        $('.change-pseudo-modal').val('');
    })

})

//classroom modal-->supprimer
$('body').on('click', '.modal-classroom-delete', function () {
    let confirm = window.confirm("Etes vous sur de vouloir supprimer la classe?")
    if (confirm) {
        ClassroomSettings.classroom = $(this).parent().parent().parent().attr('data-link')
        Main.getClassroomManager().deleteClassroom(ClassroomSettings.classroom).then(function (classroom) {
            deleteClassroomInList(classroom.link);
            classroomsDisplay();
            displayNotification('#notif-div', "classroom.notif.classroomDeleted", "success", `'{"classroomName": "${classroom.name}"}'`);
        })
        ClassroomSettings.classroom = null
    }
})

//classroom modal-->modifier
$('body').on('click', '.modal-classroom-modify', function () {
    ClassroomSettings.classroom = $(this).parent().parent().parent().attr('data-link')
    navigatePanel('classroom-dashboard-form-classe-panel', 'dashboard-classes-teacher')
})

//ouvre le dashboard d'une classe
$('body').on('click', '.class-card', function () {
    if (!$(this).find("i:hover").length) {
        ClassroomSettings.classroom = $(this).find('.class-card-top').attr('data-link')
        navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', ClassroomSettings.classroom)
    }
})

function setNote(note, el) {
    Activity.note = note
    if (note > 1) {
        Activity.correction = 2
    } else {
        Activity.correction = 3
    }
    $('.note-choice').removeClass('selectNote')
    $('#' + el).addClass('selectNote')
}

function giveNote() {
    let comment = $('#commentary-textarea').val()
    console.log(comment)
    Main.getClassroomManager().setActivityCorrection(Activity, Activity.correction, Activity.note, comment).then(function (exercise) {
        Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
            Activity = exercise
            navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', ClassroomSettings.classroom)
        })

    })
}


//affiche le bilan d'un élève
$('body').on('click', '.username .col-6, .username .propic', function () {
    if ($('#student-bilan-return').length > 0) {
        let id = parseInt($(this).parent().attr('data-student-id'))
        let students = getClassroomInListByLink(ClassroomSettings.classroom)[0].students
        let student = getStudentInListById(id, students)
        displayStudentsInClassroom(student)
        $('.legend').after('<button id="student-bilan-return"class="btn c-btn-primary">Retour à la classe</button>')
    }
})
$('body').on('click', '#student-bilan-return', function () {
    $(this).remove()
    navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', ClassroomSettings.classroom)
})
//retirer un étudiant du tableau
$('body').on('click', '.remove-student', function () {
    $(this).parent().remove()
})

//ajout d'une classe en bdd
$('.new-classroom-form').click(function () {
    $(this).attr('disabled', 'disabled')
    $('#body-table-teach').html('')
    $('#header-table-teach').html('<th style="max-width:250px;color:var(--text-1);">Activités</th>')
    if (ClassroomSettings.classroom == null) {
        Main.getClassroomManager().addClassroom({
            'name': $('#classroom-form-name').val(),
            'school': $('#classroom-form-school').val()
        }).then(function (classroom) {
            // If the backend detects that the user is not a premium user and that he already has one classroom
            if(classroom == false){
                displayNotification('#notif-div', "classroom.notif.classNotCreated", "error");
            }else{
                let students = []
                let existingStudents = []
                $('#table-students ul li .col').each(function (index) {
                    if ($(this).html() != "") {
                        students.push($(this).html())
                    }
                })
                if(students.length){
                    Main.getClassroomManager().addUsersToGroup(students, existingStudents, classroom.link).then(function (response) {
                        if(!response.isUsersAdded){
                            displayNotification('#notif-div', "classroom.notif.classCreatedButNotUsers", "error", `'{"classroomName": "${classroom.name}", "learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
                        }
                        else{
                            Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                                ClassroomSettings.classroom = classroom.link;
                                addUserAndGetDashboard(classroom.link);
                                displayNotification('#notif-div', "classroom.notif.classroomCreated", "success", `'{"classroomName": "${classroom.name}"}'`);
                                $('.new-classroom-form').attr('disabled', false);
                            });
                        }
                    });
                }else{
                    Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                        ClassroomSettings.classroom = classroom.link;
                        addUserAndGetDashboard(classroom.link);
                        displayNotification('#notif-div', "classroom.notif.classroomCreated", "success", `'{"classroomName": "${classroom.name}"}'`);
                        $('.new-classroom-form').attr('disabled', false);
                    });
                }
            }
        });
    } else {
        Main.getClassroomManager().updateClassroom({
            'name': $('#classroom-form-name').val(),
            'school': $('#classroom-form-school').val(),
            'link': ClassroomSettings.classroom
        }).then(function (classroom) {
            let students = []
            let existingStudents = []
            $('.student-form-name').each(function (index) {
                if ($(this).val() != "") {
                    if (parseInt($(this).attr('data-id')) > 0) {
                        existingStudents.push({
                            'pseudo': $(this).val(),
                            'id': $(this).attr('data-id')
                        })
                    } else {
                        students.push($(this).val())
                    }
                }
            })
            Main.getClassroomManager().addUsersToGroup(students, existingStudents, classroom.link).then(function (response) {
                if(!response.isUsersAdded){
                    displayNotification('#notif-div', "classroom.notif.classUpdatedButNotUsers", "error", `'{"classroomName": "${classroom.name}", "learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
                }
                else{
                    Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                        ClassroomSettings.classroom = null
                        addUserAndGetDashboard(classroom.link)
                        displayNotification('#notif-div', "classroom.notif.classroomUpdated", "success", `'{"classroomName": "${classroom.name}"}'`)
                    });
                }
            })
        });
    }
})
//add students to a classroom
$('body').on('click', '.save-student-in-classroom', function () {
    if (ClassroomSettings.classroom != null) {
        let students = []
        let existingStudents = []
        $('.student-form-name').each(function (index) {
            if ($(this).val() != "") {
                if (parseInt($(this).attr('data-id')) > 0) {
                    existingStudents.push({
                        'pseudo': $(this).val(),
                        'id': $(this).attr('data-id')
                    })
                } else {
                    students.push($(this).val())
                }
            }
        })
        Main.getClassroomManager().addUsersToGroup(students, existingStudents, ClassroomSettings.classroom).then(function (response) {
            if(!response.isUsersAdded){
                displayNotification('#notif-div', "classroom.notif.usersNotAdded", "error", `'{"learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
            }else{
                Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                    addUserAndGetDashboard(ClassroomSettings.classroom);
                    $('#add-student-div').html(BASE_STUDENT_FORM);
                    pseudoModal.closeModal('add-student-modal')
                    displayNotification('#notif-div', "classroom.notif.usersAdded", "success")
                });
            }
        })
    } else {
        $('#no-student-label').remove()
        $('#table-students ul').append(addStudentRow($('.student-form-name').val()))
        pseudoModal.closeModal('add-student-modal')
    }

})

function reorderActivities(activities, indexes) {
    let arrayActivities = new Array()
    let arrayActivitiesbis = new Array()
    indexes.forEach(element => {
        arrayActivities.push(element)
        arrayActivitiesbis.push(element)
    })
    activities.forEach(element => {
        let i = 0
        arrayActivities.forEach(elbis => {

            if (elbis.id == element.reference) {
                arrayActivitiesbis[i] = element
            }
            i++
        })
    })
    return arrayActivitiesbis
}
//ne peut attribuer une activité qu'une fois pour le dashboard
//faudrait ajouter une notif "cette activité lui a déja été attribuée"
function listIndexesActivities(students) {
    ClassroomSettings.indexRef = []
    let indexArray = new Array()
    let indexArraybis = new Array()
    students.forEach(element => {
        element.activities.forEach(element => {
            if (!indexArray.includes(element.reference)) {
                indexArray.push(element.reference)
                indexArraybis.push({
                    id: element.reference,
                    title: element.activity.title
                })
                ClassroomSettings.indexRef.push(element)

            }
        })
    })
    return indexArraybis
}

function addUserAndGetDashboard(link) {
    navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', link)
}

function getClassroomInListByLink(link) {
    return Main.getClassroomManager()._myClasses.filter(x => x.classroom.link == link)
}

function addClassroomInList(classroom) {
    Main.getClassroomManager()._myClasses.push(classroom)
}

function addSandboxInList(project) {
    Main.getClassroomManager()._myProjects.push(project)
}

function addStudentActivityInList(student, activity) {
    Main.getClassroomManager()._myClasses.foreach(function (element, index) {
        if (ClassroomSettings.classroom == element.classroom.link) {
            var classroomIndex = index;
            element.students.foreach(function (element, index) {
                if (student.id == element.id) {
                    var studentIndex = index;
                    element.activities.push(activity)

                }
            })
        }
    })
    if (classroomIndex && studentIndex) {
        Main.getClassroomManager()._myClasses[classroomIndex].students[studentIndex].push(activity)
    } else {
        console.log("l'actualisation des activités a échoué")
    }
}

function deleteClassroomInList(link) {
    Main.getClassroomManager()._myClasses = Main.getClassroomManager()._myClasses.filter(x => x.classroom.link !== link)
}

function deleteStudentInList(id, linkClassroom) {
    let classroom = getClassroomInListByLink(linkClassroom)[0]
    let classroomToChange = classroom.students.filter(x => x.user.id !== id)
    classroomToChange = {
        classroom: classroom.classroom,
        students: classroomToChange
    }
    Main.getClassroomManager()._myClasses = Main.getClassroomManager()._myClasses.filter(x => x.classroom.link !== linkClassroom)
    Main.getClassroomManager()._myClasses.push(classroomToChange)
    return classroomToChange
}

function changePseudoStudentInList(id, linkClassroom, pseudo) {
    let classroom = getClassroomInListByLink(linkClassroom)[0];
    let userToChange = classroom.students.filter(x => x.user.id == id)[0];
    userToChange.user.pseudo = pseudo
    let studentList = classroom.students.filter(x => x.user.id !== id)
    studentList.push(userToChange)
    classroom = {
        classroom: classroom.classroom,
        students: studentList
    }
    Main.getClassroomManager()._myClasses = Main.getClassroomManager()._myClasses.filter(x => x.classroom.link !== linkClassroom)
    Main.getClassroomManager()._myClasses.push(classroom)
    return classroom
}

function getStudentInListById(id, students) {
    return students.filter(x => x.user.id == id)
}

function getAttributionByRef(ref) {
    return ClassroomSettings.indexRef.filter(x => x.reference == ref)[0]

}

function getTeacherActivityInList(id) {
    return Main.getClassroomManager()._myTeacherActivities.filter(x => x.id == id)[0]
}

function deleteTeacherActivityInList(id) {
    Main.getClassroomManager()._myTeacherActivities = Main.getClassroomManager()._myTeacherActivities.filter(x => x.id !== id)
}


function deleteSandboxInList(link) {
    Main.getClassroomManager()._myProjects = Main.getClassroomManager()._myProjects.filter(x => x.link !== link)
}

function addTeacherActivityInList(activity) {
    Main.getClassroomManager()._myTeacherActivities.push(activity)
}

function addProjectInList(project) {
    Main.getClassroomManager()._myProjects.push(project)
}

function filterTeacherActivityInList(keywords = [], orderBy = 'id', asc = true) {

    let expression = ''
    for (let i = 0; i < keywords.length; i++) {
        expression += '(?=.*'
        expression += keywords[i].toUpperCase()
        expression += ')'

    }
    regExp = new RegExp(expression)
    let list = Main.getClassroomManager()._myTeacherActivities.filter(x => regExp.test(x.title.toUpperCase()) || regExp.test(x.content.toUpperCase()))
    if (asc) {
        return list.sort(function (a, b) {
            return a[orderBy] - b[orderBy];
        })
    } else {
        return list.sort(function (a, b) {
            return b[orderBy] - a[orderBy];
        })
    }

}

function filterSandboxInList(keywords = [], orderBy = 'id', asc = true) {

    let expression = ''
    for (let i = 0; i < keywords.length; i++) {
        expression += '(?=.*'
        expression += keywords[i].toUpperCase()
        expression += ')'

    }
    regExp = new RegExp(expression)
    let list = Main.getClassroomManager()._myProjects.filter(x => regExp.test(x.name.toUpperCase()) || regExp.test(x.description.toUpperCase()))
    if (asc) {
        return list.sort(function (a, b) {
            return a[orderBy] - b[orderBy];
        })
    } else {
        return list.sort(function (a, b) {
            return b[orderBy] - a[orderBy];
        })
    }

}

function displayStudentsInClassroom(students) {
    $('#body-table-teach').html('') //clean the display
    $('#add-student-container').html('') //clean the display
    $('#header-table-teach').html('<th class="table-title" style="max-width: 250px; font-size: 19pt; text-align: left; height: 3em;" data-i18n="classroom.activities.title">Activités</th>')
    let index = 0;
    let arrayIndexesActivities = listIndexesActivities(students)
    if (students[0].user.pseudo == "vittademo") {
        students.sort(function (a, b) {
            return (a.pseudo > b.pseudo) ? 1 : -1;
        })
    }
    students.forEach(element => {
        let arrayActivities = reorderActivities(element.activities, arrayIndexesActivities)
        let html = ''
        let pseudo = element.user.pseudo
        if (element.user.pseudo.length > 10) {
            pseudo = element.user.pseudo.slice(0, 9) + "&#8230;"
        }
        if (element.user.pseudo == "vittademo") {
            html = `<tr><td class="username row" data-student-id="` + element.user.id + `"><img class="col-2 propic" src="/public/content/img/alphabet/` + element.user.pseudo.slice(0, 1).toUpperCase() + `.png" alt="Photo de profil"><div class="col-7 line_height34" title="` + element.user.pseudo + `">` + pseudo + ` </div> <div class="dropdown col "><i class="classroom-clickable line_height34 fas fa-exchange-alt" type="button" id="dropdown-studentItem-${element.user.id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></i>
            <div class="dropdown-menu" aria-labelledby="dropdown-studentItem-${element.user.id}">
        <li id="mode-apprenant" class="dropdown-item classroom-clickable col-12" href="#" onclick="modeApprenant()">Mode apprenant</li>
      </div>
      </div></td>`
        } else {
            html = `<tr><td class="username row" data-student-id="` + element.user.id + `"><img class="col-2 propic" src="/public/content/img/alphabet/` + element.user.pseudo.slice(0, 1).toUpperCase() + `.png" alt="Photo de profil"><div class="col-7 line_height34" title="` + element.user.pseudo + `">` + pseudo + ` </div><div class="dropdown col"><i class="classroom-clickable line_height34 fas fa-cog" type="button" id="dropdown-studentItem-${element.user.id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></i>
            <div class="dropdown-menu" aria-labelledby="dropdown-studentItem-${element.user.id}">
            <li class="col-12 pwd-display-stud" href="#">Votre mot de passe : <span class="masked">${element.pwd}  </span><i class="classroom-clickable fas fa-low-vision switch-pwd ml-2"></i></li>
            <li class="modal-student-password classroom-clickable col-12 dropdown-item" href="#">Régenérer le mot de passe</li>
        <li class="classroom-clickable col-12 dropdown-item" href="#"><span class="classroom-clickable" onclick="changePseudoModal('${element.user.pseudo}',${element.user.id})">Modifier le pseudo</span></li>
        <li class="dropdown-item modal-student-delete classroom-clickable col-12" href="#">Supprimer</li>
      </div>
      </div></td>`
        }
        let activityNumber = 1
        arrayActivities.forEach(el => {
            if (element.user.pseudo == "vittademo") {
                if (el.activity) {
                    $('#header-table-teach').append(`<th><div class="dropdown dropdown-act" style="width:30px;"><div id="dropdown-act-${activityNumber}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="span-act">Act.</br>n°${ activityNumber }</span><i style="display:none;font-size:2em;" class="fa fa-cog i-act" aria-hidden="true"></i><div class="dropdown-menu" aria-labelledby="dropdown-act-${activityNumber}"  data-id="${el.activity.id}" style="text-transform: none;">
                    <li class="ml-5" style="border-bottom:solid 2px black;"><b>${ el.activity.title }</b></li>
                    <li class="classroom-clickable col-12 dropdown-item " onclick="activityWatch(${el.activity.id})" ><i class="fas fa-eye"></i> Voir l'activité</li>
                    <li class=" classroom-clickable col-12 dropdown-item" onclick="activityModify(${el.activity.id})"><i class="fas fa-pen"></i> Modifier l'activité</li>
                <li class="classroom-clickable col-12 dropdown-item" onclick="attributeActivity(${el.activity.id},${el.reference})"><i class="fas fa-user-alt"></i> Modifier l'attribution</li>
                <li class="dropdown-item classroom-clickable col-12" onclick="undoAttributeActivity(${el.reference},'${el.activity.title}')"><i class="fas fa-trash-alt"></i> Retirer l'attribution</li>
              </div>
              </div></th>`)
                    activityNumber++
                } else {}
            }
            if (el.activity) {
                html += '<td class="' + statusActivity(el) + ' bilan-cell classroom-clickable" data-state="' + statusActivity(el, false) + '" data-id="' + el.id + '" title="A rendre avant le ' + formatDay(el.dateEnd) + '"></td>'
            } else {
                html += '<td class="no-activity bilan-cell" "></td>'
            }
        });
        for (let i = 0; i < 6; i++) {
            html += '<td class="no-activity bilan-cell"></td>'
        }
        html += '</tr>'
        $('#body-table-teach').append(html)
        index++
    });
    $('#add-student-container').append(`<button id="add-student-dashboard-panel" class="btn c-btn-primary">Ajouter un apprenant</button>`);
    $('#header-table-teach').append(`<th colspan="7"> <button class="btn c-btn-primary dashboard-activities-teacher" onclick="pseudoModal.openModal('add-activity-modal')">Ajouter une activité</button></th>`)
}

$('body').on('click', '.switch-pwd', function (event) {
    $(this).parent().find('span').toggleClass('masked');
    event.stopPropagation();
})

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function displayNotification(div, message, status, options = '{}') {
    let randId = getRandomInt(10000)
    let html = `<div id='notif-` + randId + `' class="vitta-notif status-` + status + `" data-i18n="` + message + `" data-i18n-options=` + options + `><div class="vitta-notif-exit-btn"><i class="fa fa-times-circle"></i></div></div>`
    $(div).append(html)
    $(div).localize()
    setTimeout(function () {
        $('#notif-' + randId).remove()
    }, 15000);
}
$('body').on('click', '.vitta-notif-exit-btn', function () {
    $(this).parent().remove()
})

function setStudentsSelect() {
    ClassroomSettings.studentList = ''
    let classrooms = Main.getClassroomManager()._myClasses
    classrooms.forEach(function (classroom) {
        classroom.students.forEach(function (student) {
            ClassroomSettings.studentList += `<input type="checkbox" class=" col-12 checkStudent-sandbox-${student.user.id}" value="${student.user.id}">${student.user.pseudo} from ${classroom.classroom.name}</option>`
        })
    })
}

function actualizeStudentActivities(activity, correction) {
    let tempActivities = Main.getClassroomManager()._myActivities.newActivities.filter(x => x.id !== activity.id)
    Main.getClassroomManager()._myActivities.newActivities = tempActivities
    if (correction == 1) {
        Main.getClassroomManager()._myActivities.currentActivities.push(activity)
    } else {
        Main.getClassroomManager()._myActivities.doneActivities.push(activity)
    }

}

function addStudentRow(pseudo) {
    return `
    <li class="row align-items-center my-1 ">
        <img class="col-2 propic" src="/public/content/img/alphabet/` + pseudo.slice(0, 1).toUpperCase() + `.png" alt="Photo de profil">
        <div class="col">` + pseudo + `</div>
        <button type=\"button\" class=\"btn btn-danger remove-student h-50\" data-toggle=\"tooltip\" data-placement=\"top\"  >
            <i class=\"fas fa-times\"></i>
        </button>
    </li>`
}