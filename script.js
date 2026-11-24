
/* =========================================
   TASKMATE - STUDENT PRODUCTIVITY DASHBOARD
   FUNCTIONAL JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. GET HTML ELEMENTS
    // =====================================

    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");
    const completedList = document.getElementById("completedList");
    const deadlineList = document.getElementById("deadlineList");
    const deadlinePreview = document.getElementById("deadlinePreview");

    const taskSearch = document.getElementById("taskSearch");
    const priorityFilter = document.getElementById("priorityFilter");

    const studentName = document.getElementById("studentName");
    const studentInitial = document.getElementById("studentInitial");
    const editNameBtn = document.getElementById("editNameBtn");


    // =====================================
    // 2. LOAD SAVED TASKS
    // =====================================

    function loadTasks() {
        try {
            const savedTasks = JSON.parse(
                localStorage.getItem("taskmateTasks")
            );

            return Array.isArray(savedTasks) ? savedTasks : [];

        } catch (error) {
            console.error("Unable to load saved tasks:", error);
            return [];
        }
    }

    let tasks = loadTasks();

    function saveTasks() {
        localStorage.setItem("taskmateTasks", JSON.stringify(tasks));
    }


    // =====================================
    // 3. STUDENT PROFILE
    // =====================================

    function updateStudentProfile(name) {

        studentName.textContent = name;

        studentInitial.textContent =
            name.charAt(0).toUpperCase();

        localStorage.setItem("taskmateStudentName", name);
    }

    const savedStudentName =
        localStorage.getItem("taskmateStudentName");

    if (savedStudentName) {
        updateStudentProfile(savedStudentName);
    }

    editNameBtn.addEventListener("click", function () {

        const newName = prompt(
            "Enter your student name:",
            studentName.textContent
        );

        if (newName === null) return;

        const cleanedName = newName.trim();

        if (!cleanedName) {
            alert("Student name cannot be empty.");
            return;
        }

        updateStudentProfile(cleanedName);

    });


    // =====================================
    // 4. SEARCH AND FILTER
    // =====================================

    function getSearchTerm() {
        return taskSearch.value.trim().toLowerCase();
    }

    function matchesSearch(task) {

        const searchTerm = getSearchTerm();

        const taskName = String(task.name || "").toLowerCase();
        const subject = String(task.subject || "").toLowerCase();

        const matchesText =
            taskName.includes(searchTerm) ||
            subject.includes(searchTerm);

        const selectedPriority = priorityFilter.value;

        const matchesPriority =
            selectedPriority === "All" ||
            task.priority === selectedPriority;

        return matchesText && matchesPriority;
    }

    taskSearch.addEventListener("input", renderAll);

    priorityFilter.addEventListener("change", renderAll);


    // =====================================
    // 5. DATE FUNCTIONS
    // =====================================

    function getToday() {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatDate(dateString) {

        if (!dateString) return "No date";

        const date = new Date(dateString + "T00:00:00");

        if (Number.isNaN(date.getTime())) return "Invalid date";

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function isOverdue(task) {

        return task.status === "Pending" &&
            task.dueDate < getToday();
    }

    function getDaysDifference(dateString) {

        const today = new Date(getToday() + "T00:00:00");
        const dueDate = new Date(dateString + "T00:00:00");

        return Math.round(
            (dueDate - today) / (1000 * 60 * 60 * 24)
        );
    }


    // =====================================
    // 6. ESCAPE HTML
    // =====================================

    function escapeHTML(value) {

        return String(value).replace(/[&<>"']/g, function (character) {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }


    // =====================================
    // 7. ADD NEW TASK
    // =====================================

    taskForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const taskName =
            document.getElementById("taskName").value.trim();

        const subject =
            document.getElementById("subject").value.trim();

        const dueDate =
            document.getElementById("dueDate").value;

        const priority =
            document.getElementById("priority").value;

        if (!taskName || !subject || !dueDate || !priority) {
            alert("Please complete all fields.");
            return;
        }

        const newTask = {

            id: Date.now().toString() +
                Math.random().toString(36).slice(2),

            name: taskName,
            subject: subject,
            dueDate: dueDate,
            priority: priority,
            status: "Pending",
            createdAt: new Date().toISOString(),
            completedAt: null

        };

        tasks.push(newTask);

        saveTasks();
        renderAll();

        taskForm.reset();

        alert("Task successfully added!");

        document.getElementById("tasks").scrollIntoView({
            behavior: "smooth"
        });

    });


    // =====================================
    // 8. RENDER PENDING TASKS
    // =====================================

    function renderPendingTasks() {

        const pendingTasks = tasks.filter(task =>
            task.status === "Pending" && matchesSearch(task)
        );

        if (pendingTasks.length === 0) {

            taskList.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-cell">
                        ${getSearchTerm() || priorityFilter.value !== "All"
                            ? "No matching tasks found."
                            : "No tasks yet. Add your first activity!"}
                    </td>
                </tr>
            `;

            return;
        }

        pendingTasks.sort((a, b) =>
            a.dueDate.localeCompare(b.dueDate)
        );

        taskList.innerHTML = pendingTasks.map(task => {

            const overdue = isOverdue(task);

            const statusClass = overdue
                ? "status-overdue"
                : "status-pending";

            const statusText = overdue
                ? "Overdue"
                : "Pending";

            return `
                <tr>

                    <td class="task-name-cell">
                        ${escapeHTML(task.name)}
                    </td>

                    <td class="subject-cell">
                        ${escapeHTML(task.subject)}
                    </td>

                    <td>
                        ${formatDate(task.dueDate)}
                    </td>

                    <td>
                        <span class="priority-badge priority-${task.priority.toLowerCase()}">
                            ${escapeHTML(task.priority)}
                        </span>
                    </td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>

                        <div class="action-buttons" style="margin-top:7px;">

                            <button
                                type="button"
                                class="action-btn action-complete"
                                data-action="complete"
                                data-id="${escapeHTML(task.id)}">
                                Complete
                            </button>

                            <button
                                type="button"
                                class="action-btn"
                                data-action="edit"
                                data-id="${escapeHTML(task.id)}">
                                Edit
                            </button>

                            <button
                                type="button"
                                class="action-btn action-delete"
                                data-action="delete"
                                data-id="${escapeHTML(task.id)}">
                                Delete
                            </button>

                        </div>
                    </td>

                </tr>
            `;

        }).join("");

    }


    // =====================================
    // 9. RENDER COMPLETED TASKS
    // =====================================

    function renderCompletedTasks() {

        const completedTasks = tasks.filter(task =>
            task.status === "Completed" && matchesSearch(task)
        );

        if (completedTasks.length === 0) {

            completedList.innerHTML = `
                <p class="empty-message">
                    ${getSearchTerm() || priorityFilter.value !== "All"
                        ? "No matching completed tasks found."
                        : "No completed tasks yet."}
                </p>
            `;

            return;
        }

        completedList.innerHTML = completedTasks.map(task => `

            <div class="completed-card">

                <div>
                    <h3>${escapeHTML(task.name)}</h3>

                    <p>
                        ${escapeHTML(task.subject)}
                        · Due ${formatDate(task.dueDate)}
                    </p>

                    <p>
                        Completed: ${
                            task.completedAt
                                ? formatDate(task.completedAt)
                                : "Previously completed"
                        }
                    </p>
                </div>

                <span class="status-badge status-completed">
                    Completed
                </span>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="action-btn"
                        data-action="restore"
                        data-id="${escapeHTML(task.id)}">
                        Restore
                    </button>

                    <button
                        type="button"
                        class="action-btn action-delete"
                        data-action="delete"
                        data-id="${escapeHTML(task.id)}">
                        Delete
                    </button>

                </div>

            </div>

        `).join("");

    }


    // =====================================
    // 10. RENDER DEADLINES
    // =====================================

    function renderDeadlines() {

        const upcomingTasks = tasks
            .filter(task =>
                task.status === "Pending" &&
                task.dueDate >= getToday()
            )
            .filter(matchesSearch)
            .sort((a, b) =>
                a.dueDate.localeCompare(b.dueDate)
            );

        if (upcomingTasks.length === 0) {

            deadlineList.innerHTML = `
                <p class="empty-message">
                    ${getSearchTerm() || priorityFilter.value !== "All"
                        ? "No matching deadlines found."
                        : "No upcoming deadlines."}
                </p>
            `;

        } else {

            deadlineList.innerHTML = upcomingTasks.map(task => `

                <div class="deadline-card">

                    <div>
                        <h3>${escapeHTML(task.name)}</h3>
                        <p>
                            ${escapeHTML(task.subject)}
                            · ${escapeHTML(task.priority)} Priority
                        </p>
                    </div>

                    <div class="deadline-card-right">

                        <span class="deadline-date">
                            ${formatDate(task.dueDate)}
                        </span>

                        <span class="status-badge status-pending">
                            ${getDaysDifference(task.dueDate) === 0
                                ? "Today"
                                : getDaysDifference(task.dueDate) + " days left"}
                        </span>

                    </div>

                </div>

            `).join("");

        }


        // UPCOMING REMINDER PREVIEW

        const previewTasks = upcomingTasks.slice(0, 4);

        if (previewTasks.length === 0) {

            deadlinePreview.innerHTML = `
                <p class="empty-message">
                    No upcoming deadlines.
                </p>
            `;

        } else {

            deadlinePreview.innerHTML = previewTasks.map(task => `

                <div class="reminder-item">

                    <div class="reminder-info">
                        <strong>${escapeHTML(task.name)}</strong>
                        <span>${escapeHTML(task.subject)}</span>
                    </div>

                    <div class="reminder-date">
                        ${formatDate(task.dueDate)}
                    </div>

                </div>

            `).join("");

        }

    }


    // =====================================
    // 11. UPDATE DASHBOARD STATISTICS
    // =====================================

    function updateDashboard() {

        const total = tasks.length;

        const pending = tasks.filter(task =>
            task.status === "Pending"
        ).length;

        const completed = tasks.filter(task =>
            task.status === "Completed"
        ).length;

        const today = getToday();

        const todayDate = new Date(today + "T00:00:00");
        const sevenDaysLater = new Date(todayDate);

        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const sevenDaysString =
            sevenDaysLater.getFullYear() + "-" +
            String(sevenDaysLater.getMonth() + 1).padStart(2, "0") + "-" +
            String(sevenDaysLater.getDate()).padStart(2, "0");

        const upcoming = tasks.filter(task =>
            task.status === "Pending" &&
            task.dueDate >= today &&
            task.dueDate <= sevenDaysString
        ).length;

        const overdue = tasks.filter(isOverdue).length;

        const completionRate = total === 0
            ? 0
            : Math.round((completed / total) * 100);


        document.getElementById("totalTasks").textContent = total;
        document.getElementById("pendingTasks").textContent = pending;
        document.getElementById("completedTasks").textContent = completed;
        document.getElementById("upcomingTasks").textContent = upcoming;

        document.getElementById("completionRate").textContent =
            completionRate + "%";

        document.getElementById("progressCompleted").textContent =
            completed;

        document.getElementById("progressPending").textContent =
            pending;

        document.getElementById("progressTotal").textContent =
            total;


        const progressCircle =
            document.getElementById("progressCircle");

        progressCircle.style.background =
            `conic-gradient(
                var(--emerald) ${completionRate * 3.6}deg,
                #eaf0eb ${completionRate * 3.6}deg
            )`;


        const caption = total === 0
            ? "Start adding tasks to track your progress!"
            : overdue > 0
                ? `You have ${overdue} overdue task(s). Prioritize your pending work!`
                : `${completionRate}% of your tasks have been completed. Keep going!`;

        document.getElementById("progressCaption").textContent = caption;

    }


    // =====================================
    // 12. TASK ACTIONS
    // =====================================

    function handleTaskAction(event) {

        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const taskId = button.dataset.id;
        const action = button.dataset.action;

        const task = tasks.find(item =>
            String(item.id) === String(taskId)
        );

        if (!task) return;


        // COMPLETE TASK

        if (action === "complete") {

            task.status = "Completed";
            task.completedAt = getToday();

            saveTasks();
            renderAll();

            alert("Task marked as completed!");

        }


        // RESTORE TASK

        else if (action === "restore") {

            task.status = "Pending";
            task.completedAt = null;

            saveTasks();
            renderAll();

            alert("Task successfully restored!");

        }


        // EDIT TASK

        else if (action === "edit") {

            const newName = prompt(
                "Edit task name:",
                task.name
            );

            if (newName === null) return;

            const cleanedName = newName.trim();

            if (!cleanedName) {
                alert("Task name cannot be empty.");
                return;
            }

            const newSubject = prompt(
                "Edit subject:",
                task.subject
            );

            if (newSubject === null) return;

            const cleanedSubject = newSubject.trim();

            if (!cleanedSubject) {
                alert("Subject cannot be empty.");
                return;
            }

            const newDate = prompt(
                "Enter new due date (YYYY-MM-DD):",
                task.dueDate
            );

            if (newDate === null) return;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) ||
                Number.isNaN(new Date(newDate + "T00:00:00").getTime())) {

                alert("Please enter a valid date in YYYY-MM-DD format.");
                return;
            }

            const newPriority = prompt(
                "Enter priority: High, Medium, or Low",
                task.priority
            );

            if (newPriority === null) return;

            const normalizedPriority =
                newPriority.trim().toLowerCase();

            const priorityMap = {
                high: "High",
                medium: "Medium",
                low: "Low"
            };

            if (!priorityMap[normalizedPriority]) {
                alert("Priority must be High, Medium, or Low.");
                return;
            }

            task.name = cleanedName;
            task.subject = cleanedSubject;
            task.dueDate = newDate;
            task.priority = priorityMap[normalizedPriority];

            saveTasks();
            renderAll();

            alert("Task successfully updated!");

        }


        // DELETE TASK

        else if (action === "delete") {

            const confirmDelete = confirm(
                "Are you sure you want to delete this task?"
            );

            if (!confirmDelete) return;

            tasks = tasks.filter(item =>
                String(item.id) !== String(taskId)
            );

            saveTasks();
            renderAll();

            alert("Task deleted successfully!");

        }

    }


    taskList.addEventListener("click", handleTaskAction);
    completedList.addEventListener("click", handleTaskAction);


    // =====================================
    // 13. RENDER EVERYTHING
    // =====================================

    function renderAll() {

        renderPendingTasks();
        renderCompletedTasks();
        renderDeadlines();
        updateDashboard();

    }


    // =====================================
    // 14. INITIALIZE WEBSITE
    // =====================================

    renderAll();

});
